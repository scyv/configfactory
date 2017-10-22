# ConfigFactory
.NET Core application for managing configuration files across multiple projects, based on templates.

Helpful, when you have configuration files in different projects that differ only in some small passages or configuration values

## Getting started

### Prerequisites

* Download the .net SDK (https://www.microsoft.com/net/core)
* Clone this project
* Open terminal and navigate to the folder where the ConfigFactory.csproj file is
* Run ``dotnet run``

If everything is ok so far, you should see the output:

```
Usage: 
  dotnet ConfigFactory.dll <options>
 Options:
   -p=path Path to the master data (required, this is where your cf.json lives)
```

### Configuration

* Now look at the test_master directory
* Here you will find a file called ``cf.json``. Open it.
* This is the file where the main configuration takes place:
  * What projects have to be processed (``projects:  [ ... ] ``)
  * Where are these projects (``BaseDir: ...``)
  * What are the replacements (``Replacements: [ ... ] ``)
  * Where are the templates (``TemplateMappings:  [ ... ] ``)
  * How should the templates be mapped

The example says:

* I have two projects ``test1`` and ``test2``
* I want to replace ``webserverPort``, ``mockserverPort`` and ``livereloadPort`` for both projects and ``additionalCodeLine`` only for ``test1``
* I have one file where these replacements should take place (masterFile.js, the ``From``)
* Destination of the "instance" (the ``To``) is: ``some/deep/dir/file.js``. This path is prefixed by ``BaseDir`` of each project.

### Building

* Run ``dotnet build``
* The Application is now built and can be found in: ./bin/Debug/netcoreapp2.0/

### Process the template and generate output

* Run ``dotnet ./bin/Debug/netcoreapp2.0/ConfigFactory.dll -p=test_master``
* You will find the output according to the cf.json in ../test1 and ../test2




