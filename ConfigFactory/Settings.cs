using System;
using System.Collections.Generic;

namespace ConfigFactory
{

    class Settings
    {

        public static readonly String PARAM_MASTER_PATH = "-p";
        public static readonly String PARAM_MASTER_DEFINITION_FILE = "-d";

        private Dictionary<string, object> dict = new Dictionary<string, object>();

        public static Settings createFromArgline()
        {
            Settings settings = new Settings();
            foreach (string arg in Environment.GetCommandLineArgs())
            {
                string[] keyValue = arg.Split("=");
                if (keyValue.Length > 1)
                {
                    settings.Add(keyValue[0], keyValue[1]);
                }
            }
            return settings;

        }

        public void Add(string key, object value)
        {
            this.dict.Add(key, value);
        }

        public object Get(string key, object defaultValue)
        {
            object value = defaultValue;
            dict.TryGetValue(key, out value);
            return value;
        }

        public override string ToString()
        {
            string str = "";
            foreach (KeyValuePair<string, object> kvp in dict)
            {
                str += (" " + kvp.Key + "=" + kvp.Value + "\n");
            }
            return str;
        }
    }

}
