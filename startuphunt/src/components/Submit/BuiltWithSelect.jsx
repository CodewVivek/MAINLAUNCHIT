import React, { useState, useMemo } from "react";
import CreatableSelect from "react-select/creatable";
import { components } from "react-select";
import { useTheme } from "../ThemeProvider";

const initialTechOptions = [
    { value: "javascript", label: "JavaScript", logo: "https://cdn.simpleicons.org/javascript" },
    { value: "html", label: "HTML", logo: "https://cdn.simpleicons.org/html5" },
    { value: "css", label: "CSS", logo: "https://cdn.simpleicons.org/css3" },
    { value: "react", label: "ReactJS", logo: "https://cdn.simpleicons.org/react" },
    { value: "nodejs", label: "Node.js", logo: "https://cdn.simpleicons.org/nodedotjs" },
    { value: "supabase", label: "Supabase", logo: "https://cdn.simpleicons.org/supabase" },
    { value: "typescript", label: "TypeScript", logo: "https://cdn.simpleicons.org/typescript" },
    { value: "nextjs", label: "NextJS", logo: "https://cdn.simpleicons.org/nextdotjs/000000" },
    { value: "redux", label: "Redux", logo: "https://cdn.simpleicons.org/redux" },
    { value: "firebase", label: "Firebase", logo: "https://cdn.simpleicons.org/firebase" },
    { value: "tailwindcss", label: "TailwindCSS", logo: "https://cdn.simpleicons.org/tailwindcss" },
    { value: "vue", label: "Vue.js", logo: "https://cdn.simpleicons.org/vuedotjs" },
    { value: "vuex", label: "Vuex", logo: "https://cdn.simpleicons.org/vuedotjs" },
    { value: "angular", label: "Angular", logo: "https://cdn.simpleicons.org/angular" },
    { value: "python", label: "Python", logo: "https://cdn.simpleicons.org/python" },
    { value: "django", label: "Django", logo: "https://cdn.simpleicons.org/django" },
    { value: "flask", label: "Flask", logo: "https://cdn.simpleicons.org/flask" },
    { value: "express", label: "Express", logo: "https://cdn.simpleicons.org/express" },
    { value: "mongodb", label: "MongoDB", logo: "https://cdn.simpleicons.org/mongodb" },
    { value: "postgresql", label: "PostgreSQL", logo: "https://cdn.simpleicons.org/postgresql" },
    { value: "mysql", label: "MySQL", logo: "https://cdn.simpleicons.org/mysql" },
    { value: "graphql", label: "GraphQL", logo: "https://cdn.simpleicons.org/graphql" },
    { value: "docker", label: "Docker", logo: "https://cdn.simpleicons.org/docker" },
    { value: "kubernetes", label: "Kubernetes", logo: "https://cdn.simpleicons.org/kubernetes" },
    { value: "aws", label: "AWS", logo: "https://cdn.simpleicons.org/amazonwebservices" },
    { value: "gcp", label: "Google Cloud", logo: "https://cdn.simpleicons.org/googlecloud" },
    { value: "azure", label: "Azure", logo: "https://cdn.simpleicons.org/microsoftazure" },
    { value: "php", label: "PHP", logo: "https://cdn.simpleicons.org/php" },
    { value: "laravel", label: "Laravel", logo: "https://cdn.simpleicons.org/laravel" },
    { value: "ruby", label: "Ruby", logo: "https://cdn.simpleicons.org/ruby" },
    { value: "rails", label: "Rails", logo: "https://cdn.simpleicons.org/rubyonrails" },
    { value: "csharp", label: "C#", logo: "https://cdn.simpleicons.org/csharp" },
    { value: "dotnet", label: ".NET", logo: "https://cdn.simpleicons.org/dot-net" },
    { value: "java", label: "Java", logo: "https://cdn.simpleicons.org/oracle" },
    { value: "spring", label: "Spring", logo: "https://cdn.simpleicons.org/spring" },
    { value: "go", label: "Go", logo: "https://cdn.simpleicons.org/go" },
    { value: "swift", label: "Swift", logo: "https://cdn.simpleicons.org/swift" },
    { value: "kotlin", label: "Kotlin", logo: "https://cdn.simpleicons.org/kotlin" },
    { value: "flutter", label: "Flutter", logo: "https://cdn.simpleicons.org/flutter" },
    { value: "reactnative", label: "React Native", logo: "https://cdn.simpleicons.org/react" },
    { value: "svelte", label: "Svelte", logo: "https://cdn.simpleicons.org/svelte" },
];

const getCustomStyles = (theme) => ({
    control: (provided) => ({
        ...provided,
        borderRadius: "0.5rem",
        minHeight: "44px",
        borderColor: "hsl(var(--border))",
        boxShadow: "none",
        padding: "0px 8px",
        background: "hsl(var(--background))",
        border: "1px solid hsl(var(--border))",
        transition: "all 0.2s ease",
        "&:hover": {
            borderColor: "hsl(var(--blue-600) / 0.5)",
            background: "hsl(var(--background))",
        },
    }),
    multiValue: (provided) => ({
        ...provided,
        borderRadius: "0.375rem",
        background: "hsl(var(--muted))",
        border: "1px solid hsl(var(--border))",
        display: "flex",
        alignItems: "center",
        padding: "1px 6px",
        fontWeight: 600,
        fontSize: "0.75rem",
        color: "hsl(var(--foreground))",
    }),
    multiValueLabel: (provided) => ({
        ...provided,
        padding: 0,
        display: "flex",
        alignItems: "center",
        fontWeight: 600,
        fontSize: "0.75rem",
        color: "inherit",
    }),
    multiValueRemove: (provided) => ({
        ...provided,
        borderRadius: "50%",
        background: "transparent",
        color: "hsl(var(--muted-foreground))",
        marginLeft: 2,
        padding: 0,
        "&:hover": {
            background: "hsl(var(--destructive) / 0.1)",
            color: "hsl(var(--destructive))",
        },
    }),
    option: (provided, state) => ({
        ...provided,
        borderRadius: "0.375rem",
        background: state.isSelected
            ? "hsl(var(--blue-600))"
            : state.isFocused
                ? "hsl(var(--muted))"
                : "transparent",
        color: state.isSelected
            ? "white"
            : "hsl(var(--foreground))",
        display: "flex",
        alignItems: "center",
        fontWeight: 500,
        fontSize: "0.875rem",
        padding: "8px 12px",
        margin: "2px 0",
        cursor: "pointer",
        "&:active": {
            background: "hsl(var(--muted))",
        }
    }),
    menu: (provided) => ({
        ...provided,
        borderRadius: "0.5rem",
        background: "hsl(var(--background))",
        border: "1px solid hsl(var(--border))",
        boxShadow: "0 4px 12px -2px rgba(0,0,0,0.1)",
        marginTop: 4,
        padding: "4px",
        zIndex: 50,
        overflow: "hidden",
    }),
    input: (provided) => ({
        ...provided,
        fontSize: "0.875rem",
        fontWeight: 500,
        margin: 0,
        padding: 0,
        color: "hsl(var(--foreground))",
    }),
    placeholder: (provided) => ({
        ...provided,
        color: "hsl(var(--muted-foreground) / 0.5)",
        fontSize: "0.875rem",
    }),
    singleValue: (provided) => ({
        ...provided,
        color: "hsl(var(--foreground))",
        fontSize: "0.875rem",
    }),
});

const MultiValueLabel = (props) => (
    <components.MultiValueLabel {...props}>
        <div className="flex items-center gap-2">
            {props.data.logo && (
                <img src={props.data.logo} alt="" className="w-3.5 h-3.5 object-contain" />
            )}
            {props.data.label}
        </div>
    </components.MultiValueLabel>
);

const Option = (props) => (
    <components.Option {...props}>
        <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 flex items-center justify-center rounded bg-muted">
                {props.data.logo ? (
                    <img src={props.data.logo} alt="" className="w-3.5 h-3.5 object-contain" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-primary/20" />
                )}
            </div>
            {props.data.label}
        </div>
    </components.Option>
);

const formatCreateLabel = (inputValue) => `Add "${inputValue}"`;



export default function BuiltWithSelect({ value, onChange }) {
    const { theme } = useTheme();
    const [options, setOptions] = useState(initialTechOptions);
    const safeValue = useMemo(() => {
        if (!Array.isArray(value)) return [];
        return value.map(item => {
            if (typeof item === 'string') {
                const val = item.toLowerCase().replace(/\s+/g, '-');
                const matched = options.find(o => o.value === val);
                return matched || {
                    value: val,
                    label: item
                };
            }
            // Enrich object items with logos if missing
            if (item && !item.logo) {
                const matched = options.find(o => o.value === item.value);
                if (matched) return { ...item, logo: matched.logo };
            }
            return item;
        });
    }, [value, options]);

    const customStyles = useMemo(() => getCustomStyles(theme), [theme]);

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
        if (arr.length > 6) {
            alert("Cannot add more than 6 categories.");
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
                if (safeValue.length >= 6) {
                    alert("Cannot add more than 6 categories.");
                    return;
                }
                onChange?.([...safeValue, existing]);
            }
            return;
        }

        const newOpt = { value: label.toLowerCase().replace(/\s+/g, "-"), label };
        const next = [...options, newOpt];
        setOptions(next);

        if (safeValue.length >= 6) {
            alert("Cannot add more than 6 categories.");
            return;
        }
        onChange?.([...safeValue, newOpt]);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Built with
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded leading-none">Optional</span>
                </label>
                <div className="flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-blue-600/30" />
                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Up to 6</span>
                </div>
            </div>

            <CreatableSelect
                isMulti
                options={options}
                value={safeValue}
                onChange={handleChange}
                onCreateOption={handleCreate}
                placeholder="Search or add stack..."
                closeMenuOnSelect={false}
                hideSelectedOptions={true}
                components={{ MultiValueLabel, DropdownIndicator: null, IndicatorSeparator: null }}
                styles={customStyles}
                formatCreateLabel={formatCreateLabel}
                isClearable={false}
                isSearchable
                menuIsOpen={false}
                noOptionsMessage={() => null}
            />

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Suggestions</span>
                    <div className="h-px flex-1 bg-border/40" />
                </div>
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((opt) => (
                        <button
                            key={opt.value || opt.label}
                            type="button"
                            disabled={safeValue.length >= 6}
                            className="flex items-center gap-2 bg-background hover:bg-muted/50 text-foreground rounded-lg px-3 py-1.5 text-[11px] border border-border transition-all font-semibold disabled:opacity-50 hover:border-blue-600/30"
                            onClick={() => {
                                if (safeValue.some((v) => v && v.value === opt.value) || safeValue.length >= 6) return;
                                onChange?.([...safeValue, opt]);
                            }}
                        >
                            {opt.logo && (
                                <img src={opt.logo} alt="" className="w-3.5 h-3.5 object-contain opacity-70 group-hover:opacity-100" />
                            )}
                            {opt.label}
                            <span className="text-blue-600/40 font-bold">+</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
