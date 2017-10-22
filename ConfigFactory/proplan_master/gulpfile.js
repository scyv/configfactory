// See Readme.md for a list of the needed gulp plugins
const gulp = require("gulp");
const uglify = require("gulp-uglify");
const mockServer = require("gulp-mock-server");
const sass = require("gulp-sass");
const shell = require("gulp-shell");
const sourceMaps = require("gulp-sourcemaps");
const tslint = require("gulp-tslint");
const ts = require("gulp-typescript");
const webserver = require("gulp-webserver");
const KarmaServer = require("karma").Server;
const del = require("del");
const path = require("path");
const runSequence = require("run-sequence");
const jasmine = require("gulp-jasmine");
const merge = require("merge-stream");

/**
 * The target directory for the frontend build.
 */
const targetBaseDir = "dist";
const targetDir = targetBaseDir + "/user";
const webserverPort = "<webserverPort>";
const mockserverPort = "<mockserverPort>";
const livereloadPort = "<livereloadPort>";

/**
 * Do a light build for fast redeployment to WebSphere
 * only the necessary tasks to bring code changes to /dist folder are performed here
 */
gulp.task("build-light", function (done) {
    runSequence(
        "create-version-info",
        "transpile-typescript",
        ["copy-resources", "sass"],
        done
    );
});

/**
 * Clean the target directory from generated files.
 */
gulp.task("clean", function (done) {
    del(targetBaseDir).then(function () {
        done();
    });
});

/**
 * This will create a dummy version.ts that is needed by the application.
 * We need this when the frontend is not built with maven.
 */
gulp.task("create-version-info", function () {
    const fs = require("fs");
    const versionFile = "./main/version.ts";
    if (!fs.existsSync(versionFile)) {
        const content = "export const VERSION: string = \"DEV\";\nexport const BUILD_TIME: string = \"DEV\";\n";
        fs.writeFileSync(versionFile, content);
    }
});

/**
 * Transpiles TypeScript sources to JavaScript files in the source directory.
 * tsProject is stored globally to support incremental build
 *
 * The files are also minified with gulp-uglify
 */
const tsProject = ts.createProject("tsconfig.json");
gulp.task("transpile-typescript", function () {
    // The TypeScript project used in the transpile task.
    // Uses the global TypeScript config file (also used by IDEA).
    const tsResult = gulp.src(["./**/*.ts", "!node_modules/**/*", "!test/**/*"])
        .pipe(sourceMaps.init()).pipe(tsProject());
    return tsResult.js
        .pipe(uglify())
        .pipe(sourceMaps.write(".")).pipe(gulp.dest(targetDir));
});

/**
 * Transpiles TypeScript test sources to JavaScript files in the source directory.
 * tsTestProject is stored globally to support incremental build
 *
 * The files are NOT minified.
 */
const tsTestProject = ts.createProject("tsconfig.json");
gulp.task("transpile-test-typescript", function () {
    const tsResult = gulp.src(["./**/*.ts", "!node_modules/**/*"]).pipe(sourceMaps.init()).pipe(tsTestProject());
    return tsResult.js.pipe(gulp.dest(targetDir));
});

/**
 * Build dojo/dijit/dstore/dojox and store them in the target directory.
 */
const buildScript = path.join(process.cwd(), "node_modules", "util", "buildscripts", "build");
const nixExtension = process.platform == "win32" ? "" : ".sh";
gulp.task("build-dojo", shell.task([
    'echo CAUTION: The dojo build tool will print warnings to std.err when running the closure compiler!',
    // profile config file is in ./dojo.profile.js => dojo is the build profile param
    buildScript + nixExtension + " --profile dojo.profile.js"
]));

/**
 * Remove the uncompressed files.
 */
gulp.task("remove-uncompressed", function (done) {
    del(targetDir + "/**/*.uncompressed.js").then(function () {
        done();
    });
});

/**
 * Remove bloating stuff.
 */
gulp.task("remove-bloat", function (done) {
    del(targetDir + "/lib/**/tests").then(function () {
        done();
    });
});

/**
 * Copy test data to dist to be able to access json files.
 */
gulp.task("copy-test-data", function (done) {
    return gulp.src("./test/unit/main/testData/**")
        .pipe(gulp.dest(targetDir + "/test/testData"));
});

/**
 * Copy the files from ./base to the ./dist folder.
 */
gulp.task("copy-base", function () {
    return gulp.src(["./base/**/*"])
        .pipe(gulp.dest(targetDir + "/.."));
});

/**
 * Copy libs which are not touched by the dojo build.
 */
gulp.task("copy-libs", function () {
    return merge(
        // !!!CAUTION: THIS MUST BE DONE AS DOJO-UTIL WANTS DOJO IN PARALLEL AND WANTS ITS FOLDER NAMED "util"!!!
        gulp.src("./node_modules/dojo-util/**/*").pipe(gulp.dest("./node_modules/util")),
        gulp.src("./node_modules/hammerjs/**/hammer*").pipe(gulp.dest(targetDir + "/lib/hammerjs")),
        gulp.src("./node_modules/d3/build/**").pipe(gulp.dest(targetDir + "/lib/d3"))
    );
});

/**
 * Compile sass files to css files
 */
gulp.task("sass", function () {
    return gulp.src("./scss/*.scss")
        .pipe(sass({
            outputStyle: "compressed",
            paths: [path.join(__dirname, "sass", "includes")]
        }).on("error", sass.logError))
        .pipe(gulp.dest(targetDir + "/css"));
});

/**
 * Copies the font files
 */
gulp.task("copy-fonts", function () {
    return gulp.src(["./assets/fonts/**/*"])
        .pipe(gulp.dest(targetDir + "/assets/fonts"));
});

/**
 * Copies the image files
 */
gulp.task("copy-images", function () {
    return gulp.src(["./assets/images/**/*"])
        .pipe(gulp.dest(targetDir + "/assets/images"));
});

/**
 * Copies the html files
 */
gulp.task("copy-main-html", function () {
    return gulp.src(["./main/**/*.html"])
        .pipe(gulp.dest(targetDir + "/main"));
});

/**
 * Copies the config files
 */
gulp.task("copy-config", function () {
    return gulp.src(["app.config.json"])
        .pipe(gulp.dest(targetDir + "/main"));
});

/**
 * Copies the nls/i18n files
 */
gulp.task("copy-nls", function () {
    return gulp.src(["./nls/**/*.js"])
        .pipe(gulp.dest(targetDir + "/nls"));
});

/**
 * Run TsLint analysis on TypeScript application files
 */
gulp.task("tslint", function () {
    return gulp.src(["main/**/*.ts"])
        .pipe(tslint({
            formatter: "verbose"
        }))
        .pipe(tslint.report())
});

/**
 * Watch for file changes and rerun specific tasks. This task never stops.
 */
gulp.task("watch", function () {
    gulp.watch(["base/**/*"], ["copy-base"]);
    gulp.watch(["main/**/*.html"], ["copy-main-html"]);
    gulp.watch(["scss/**/*.scss"], ["sass"]);
    gulp.watch(["nls/**/*.js"], ["copy-nls"]);
    gulp.watch(["app.config.json"], ["copy-config"]);
    gulp.watch(["assets/fonts/**/*"], ["copy-fonts"]);
    gulp.watch(["assets/images/**/*"], ["copy-images"]);
});

/**
 * Watch for file typescript file changes and rerun specific tasks. This task never stops.
 */
gulp.task("watch-ts", function () {
    gulp.watch(["main/**/*.ts"], ["transpile-typescript"]);
});

/**
 * Watch for changes in the tests and rerun tests
 */
gulp.task("watch-test", function () {
    gulp.watch(["test/**/*.ts"], ["test"]);
});

/**
 * Task for running a webserver for local testing without websphere necessary.
 * There are proxies defined to enabe simulation of ajax requests without CORS issues.
 * !Ensure that the proxy target points to the same port as mockServer in task "mock-server"!
 */
gulp.task("webserver", function () {
    gulp.src("dist")
        .pipe(webserver({
            host: "0.0.0.0",
            port: webserverPort,
            livereload: {
                port: livereloadPort,
                enable: true
            },
            proxies: [
                {
                    source: "/user/rest",
                    target: "http://localhost:" + mockserverPort
                }
            ]
        }));
});

/**
 * Launches a mock server for beeing able to access data without CORS limitations
 */
gulp.task("mock-server", function () {
    gulp.src(".")
        .pipe(mockServer({
            host: "0.0.0.0",
            port: mockserverPort,
            mockDir: "./test/mockData",
            allowCrossOrigin: true
        }));
});

/**
 * Task for running tests
 */
gulp.task("run-tests", function (done) {
    new KarmaServer({
        configFile: __dirname + '/karma.conf.js'
    }, function (exitCode) {
        done(exitCode);
    }).start();
});

/**
 * Task for removing the test files.
 */
gulp.task("remove-tests", function (done) {
    del(targetDir + "/test/**").then(function () {
        done();
    });
});

/**
 * Run Selenium Tests
 */
gulp.task("run-ui-tests", function () {
    const pathSeparator = process.platform == "win32" ? ";" : ":";
    process.env.PATH = process.env.PATH + pathSeparator + "./node_modules/phantomjs-prebuilt/lib/phantom/bin";
    process.env.PATH = process.env.PATH + pathSeparator + "./test/support";
    gulp.src(targetDir + "/test/ui/**.js")
        .pipe(jasmine());
});

/**
 * Run ui tests
 */
gulp.task("ui-test", function (done) {
    runSequence("run-ui-tests", "remove-tests", done);
});

/**
 * Runs tanspiling and test in sequencial order
 */
gulp.task("test", function (done) {
    runSequence("copy-test-data", "create-version-info", ["transpile-test-typescript"],
        "run-tests", "remove-tests", done);
});

/**
 * Task for launching the webserver and listen for filechanges. This task is useful during development for having
 * an automated reload of the browser when chaning source files.
 */
gulp.task("servehot", function (done) {
    runSequence(["dev", "webserver", "mock-server"], done);
});

/**
 * Copies the resource files
 */
gulp.task("copy-resources", function (done) {
    runSequence(
        ["copy-nls", "copy-config", "copy-main-html", "copy-images", "copy-fonts", "copy-base"], done);
});

/**
 * Do a dev build (only transpiling and scss compiling).
 */
gulp.task("dev", function (done) {
    runSequence(
        "create-version-info",
        ["transpile-typescript", "copy-images", "copy-fonts", "copy-main-html", "copy-config", "copy-resources", "sass"],
        "watch",
        done
    );
});

/**
 * Do a full build.
 */
gulp.task("default", function (done) {
    runSequence(
        "clean",
        "create-version-info",
        ["transpile-typescript", "copy-resources", "sass", "copy-libs"],
        "build-dojo",
        "remove-uncompressed",
        "remove-bloat",
        done
    );
});

