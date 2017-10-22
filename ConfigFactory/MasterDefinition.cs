using System;
using System.IO;

namespace ConfigFactory
{

    class MasterDefinition
    {
        public ProjectDefinition[] Projects { get; set; } = new ProjectDefinition[0];
        public TemplateMappingDefinition[] TemplateMappings { get; set; } = new TemplateMappingDefinition[0];
    }

    class ProjectDefinition
    {
        public string Name { get; set; } = string.Empty;
        public string BaseDir { get; set; } = string.Empty;
        public Replacement[] Replacements { get; set;  } = new Replacement[0];
    }

    class TemplateMappingDefinition
    {
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
    }

    class Replacement
    {
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}