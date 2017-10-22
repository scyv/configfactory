using System;
using System.IO;
using Newtonsoft.Json;
using Antlr4.StringTemplate;

namespace ConfigFactory
{
    class Program
    {

        static void Main(string[] args)
        {

            Settings settings = Settings.createFromArgline();
            string masterPath = (string)settings.Get(Settings.PARAM_MASTER_PATH, "");
            if (string.IsNullOrEmpty(masterPath))
            {
                Console.WriteLine("Usage: ");
                Console.WriteLine("  dotnet ConfigFactory.dll <options>");
                Console.WriteLine(" Options:");
                Console.WriteLine("   -p=path Path to the master data (required, this is where your cf.json lives)");
                Console.WriteLine("");
                return;
            }
            MasterDefinition def;
            using (StreamReader reader = new StreamReader(masterPath + "/cf.json"))
            {
                string json = reader.ReadToEnd();
                def = JsonConvert.DeserializeObject<MasterDefinition>(json);
            }


            foreach (TemplateMappingDefinition tm in def.TemplateMappings)
            {
                using (StreamReader reader = new StreamReader(masterPath + "/" + tm.From))
                {
                    string templateContent = reader.ReadToEnd();

                    foreach (ProjectDefinition pd in def.Projects)
                    {
                        Console.WriteLine("Project: " + pd.Name);
                        Template templ = new Template(templateContent);
                        foreach (Replacement repl in pd.Replacements)
                        {
                            templ.Add(repl.Key, repl.Value);
                        }


                        string target = pd.BaseDir + "/" + tm.To;
                        Console.WriteLine("Writing to: " + new FileInfo(target).FullName);
                        Directory.CreateDirectory(new FileInfo(target).DirectoryName);
                        using (StreamWriter writer = new StreamWriter(target))
                        {
                            writer.Write(templ.Render());
                        }
                        Console.WriteLine();
                    }
                }
            }
        }
    }
}
