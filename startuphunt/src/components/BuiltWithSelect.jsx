// BuiltWithSelect.jsx
import React, { useState, useMemo } from "react";
import CreatableSelect from "react-select/creatable";
import { components } from "react-select";

const initialTechOptions = [
  { value: "react", label: "ReactJS" },
  { value: "nodejs", label: "Node.js" },
  { value: "supabase", label: "supabase" },
  { value: "typescript", label: "TypeScript" },
  { value: "nextjs", label: "NextJS" },
  { value: "redux", label: "Redux" },
  { value: "firebase", label: "Firebase" },
  { value: "tailwindcss", label: "TailwindCSS" },
  { value: "javascript", label: "JavaScript" },
  { value: "vue", label: "Vue.js" },
  { value: "vuex", label: "Vuex" }, // added so suggestions work
  { value: "angular", label: "Angular" },
  { value: "python", label: "Python" },
  { value: "django", label: "Django" },
  { value: "flask", label: "Flask" },
  { value: "express", label: "Express" },
  { value: "mongodb", label: "MongoDB" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "graphql", label: "GraphQL" },
  { value: "docker", label: "Docker" },
  { value: "kubernetes", label: "Kubernetes" },
  { value: "aws", label: "AWS" },
  { value: "gcp", label: "Google Cloud" },
  { value: "azure", label: "Azure" },
  { value: "php", label: "PHP" },
  { value: "laravel", label: "Laravel" },
  { value: "ruby", label: "Ruby" },
  { value: "rails", label: "Rails" },
  { value: "csharp", label: "C#" },
  { value: "dotnet", label: ".NET" },
  { value: "java", label: "Java" },
  { value: "spring", label: "Spring" },
  { value: "go", label: "Go" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "flutter", label: "Flutter" },
  { value: "reactnative", label: "React Native" },
  { value: "svelte", label: "Svelte" },
  { value: "other", label: "Other" },
];

const customStyles = {
  control: (provided) => ({
    ...provided,
    borderRadius: "1rem",
    minHeight: "48px",
    borderColor: "#e5e7eb",
    boxShadow: "none",
    padding: "2px 4px",
    background: "#f9fafb",
  }),
  multiValue: (provided) => ({
    ...provided,
    borderRadius: "1rem",
    background: "#f3f6fa",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    padding: "2px 8px",
    fontWeight: 500,
    fontSize: "1rem",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    padding: 0,
    display: "flex",
    alignItems: "center",
    fontWeight: 500,
    fontSize: "1rem",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    borderRadius: "50%",
    background: "transparent",
    color: "#64748b",
    marginLeft: 4,
  }),
  option: (provided, state) => ({
    ...provided,
    borderRadius: "1rem",
    background: state.isFocused ? "#f3f6fa" : "#fff",
    color: "#222",
    display: "flex",
    alignItems: "center",
    fontWeight: 500,
    fontSize: "1rem",
    padding: "8px 16px",
    cursor: "pointer",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "1rem",
    boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)",
    marginTop: 4,
    zIndex: 20,
  }),
  input: (provided) => ({
    ...provided,
    fontSize: "1rem",
    fontWeight: 500,
    margin: 0,
    padding: 0,
  }),
};

const MultiValueLabel = (props) => (
  <components.MultiValueLabel {...props}>{props.data.label}</components.MultiValueLabel>
);

const Option = (props) => <components.Option {...props}>{props.data.label}</components.Option>;

const formatCreateLabel = (inputValue) => `Add "${inputValue}"`;

export default function BuiltWithSelect({ value, onChange }) {
  const [options, setOptions] = useState(initialTechOptions);
  const safeValue = Array.isArray(value) ? value : [];

  // Memoize suggestion computation for performance
  const suggestions = useMemo(() => {
    const selectedValues = safeValue
      .filter((s) => s && typeof s === "object" && s.value)
      .map((s) => s.value);

    let sugg = [];
    if (selectedValues.includes("react") && !selectedValues.includes("redux")) sugg.push("redux");
    if (selectedValues.includes("nodejs") && !selectedValues.includes("typescript")) sugg.push("typescript");
    if (selectedValues.includes("vue") && !selectedValues.includes("vuex")) sugg.push("vuex");

    if (sugg.length < 3) {
      sugg = [
        ...sugg,
        ...options
          .map((o) => o.value)
          .filter((v) => !selectedValues.includes(v) && !sugg.includes(v))
          .slice(0, 5 - sugg.length),
      ];
    }

    return options.filter((o) => sugg.includes(o.value));
  }, [safeValue, options]);

  const handleChange = (selected) => {
    const arr = selected || [];
    if (arr.length > 10) {
      // Replace with your app-level toast if desired
      alert("You can select up to 10 items.");
      return;
    }
    onChange?.(arr);
  };

  const handleCreate = (inputValue) => {
    const label = (inputValue || "").trim();
    if (!label) return;

    // Prevent duplicates (case-insensitive)
    const exists = options.some((o) => o.label.toLowerCase() === label.toLowerCase());
    if (exists) {
      const existing = options.find((o) => o.label.toLowerCase() === label.toLowerCase());
      if (!safeValue.some((v) => v && v.value === existing.value)) {
        if (safeValue.length >= 10) {
          alert("You can select up to 10 items.");
          return;
        }
        onChange?.([...safeValue, existing]);
      }
      return;
    }

    const newOpt = { value: label.toLowerCase().replace(/\s+/g, "-"), label };
    const next = [...options, newOpt];
    setOptions(next);

    if (safeValue.length >= 10) {
      alert("You can select up to 10 items.");
      return;
    }
    onChange?.([...safeValue, newOpt]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block font-semibold text-lg">Built with</label>
        <span className="text-md text-gray-400 font-medium">Up to 10</span>
      </div>

      <CreatableSelect
        isMulti
        options={options}
        value={safeValue}
        onChange={handleChange}
        onCreateOption={handleCreate}
        placeholder="Type to search or add..."
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        components={{ MultiValueLabel, Option }}
        styles={customStyles}
        formatCreateLabel={formatCreateLabel}
        isClearable={false}
        isSearchable
        menuPlacement="auto"
        maxMenuHeight={220}
        noOptionsMessage={({ inputValue }) => (inputValue ? `No results for "${inputValue}"` : "No options")}
      />

      <div className="mt-2">
        <div className="font-semibold mb-2 text-gray-500 text-lg">Suggested</div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={safeValue.length >= 10}
              className="flex items-center bg-gray-100 hover:bg-blue-100 text-gray-800 rounded-full px-3 py-1 text-md border border-gray-200 shadow-sm transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              onClick={() => {
                if (safeValue.some((v) => v && v.value === opt.value) || safeValue.length >= 10) return;
                onChange?.([...safeValue, opt]);
              }}
            >
              {opt.label}
              <span className="ml-1 font-bold text-green-600">+</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
