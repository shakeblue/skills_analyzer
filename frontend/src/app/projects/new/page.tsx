"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateProject, queryKeys } from "@/lib/api";
import type { SkillCategory, SkillRequirement } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FolderPlus,
  Plus,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORMS = [
  "Web",
  "Mobile",
  "Data",
  "E-commerce",
  "Cloud/DevOps",
] as const;

const IMPORTANCE_OPTIONS: SkillRequirement["importance"][] = [
  "critical",
  "important",
  "nice_to_have",
];

const importanceLabel: Record<SkillRequirement["importance"], string> = {
  critical: "Critical",
  important: "Important",
  nice_to_have: "Nice to have",
};

// ---------------------------------------------------------------------------
// Skill row component
// ---------------------------------------------------------------------------

interface SkillRowProps {
  skill: SkillRequirement;
  onChange: (updated: SkillRequirement) => void;
  onRemove: () => void;
}

function SkillRow({ skill, onChange, onRemove }: SkillRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Skill name"
        value={skill.name}
        onChange={(e) => onChange({ ...skill, name: e.target.value })}
        className="flex-1"
      />
      <Select
        value={String(skill.required_level)}
        onValueChange={(v) =>
          onChange({ ...skill, required_level: Number(v) })
        }
      >
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5].map((lvl) => (
            <SelectItem key={lvl} value={String(lvl)}>
              Level {lvl}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={skill.importance}
        onValueChange={(v) =>
          onChange({
            ...skill,
            importance: v as SkillRequirement["importance"],
          })
        }
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {IMPORTANCE_OPTIONS.map((imp) => (
            <SelectItem key={imp} value={imp}>
              {importanceLabel[imp]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-red-600"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category block component
// ---------------------------------------------------------------------------

interface CategoryBlockProps {
  category: SkillCategory;
  index: number;
  onChange: (updated: SkillCategory) => void;
  onRemove: () => void;
}

function CategoryBlock({
  category,
  index,
  onChange,
  onRemove,
}: CategoryBlockProps) {
  const addSkill = () => {
    onChange({
      ...category,
      skills: [
        ...category.skills,
        { name: "", required_level: 3, importance: "important" as const },
      ],
    });
  };

  const updateSkill = (si: number, updated: SkillRequirement) => {
    const skills = [...category.skills];
    skills[si] = updated;
    onChange({ ...category, skills });
  };

  const removeSkill = (si: number) => {
    onChange({
      ...category,
      skills: category.skills.filter((_, i) => i !== si),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="shrink-0">
                Category {index + 1}
              </Badge>
              <Input
                placeholder="Category name (e.g. Frontend, Backend)"
                value={category.name}
                onChange={(e) =>
                  onChange({ ...category, name: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Weight (0-1):
              </span>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={category.weight}
                onChange={(e) =>
                  onChange({
                    ...category,
                    weight: Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)),
                  })
                }
                className="w-24"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-muted-foreground hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Skills header */}
        {category.skills.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="flex-1">Skill Name</span>
            <span className="w-24 text-center">Level</span>
            <span className="w-32 text-center">Importance</span>
            <span className="w-8" />
          </div>
        )}

        {/* Skill rows */}
        {category.skills.map((skill, si) => (
          <SkillRow
            key={si}
            skill={skill}
            onChange={(updated) => updateSkill(si, updated)}
            onRemove={() => removeSkill(si)}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSkill}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Skill
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function NewProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createProject = useCreateProject();

  const [name, setName] = React.useState("");
  const [platform, setPlatform] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [categories, setCategories] = React.useState<SkillCategory[]>([]);

  const isValid =
    name.trim().length > 0 &&
    platform.length > 0 &&
    description.trim().length > 0;

  const addCategory = () => {
    setCategories((prev) => [
      ...prev,
      { name: "", weight: 0.25, skills: [] },
    ]);
  };

  const updateCategory = (ci: number, updated: SkillCategory) => {
    setCategories((prev) => {
      const next = [...prev];
      next[ci] = updated;
      return next;
    });
  };

  const removeCategory = (ci: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== ci));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) return;

    // Filter out empty skill names and empty categories
    const cleanCategories = categories
      .filter((cat) => cat.name.trim().length > 0)
      .map((cat) => ({
        ...cat,
        name: cat.name.trim(),
        skills: cat.skills.filter((s) => s.name.trim().length > 0),
      }));

    createProject.mutate(
      {
        name: name.trim(),
        platform,
        description: description.trim(),
        categories: cleanCategories,
      },
      {
        onSuccess: (project) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
          router.push(`/projects/${project.id}`);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/projects">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Projects
        </Link>
      </Button>

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Create New Project
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define a project profile with skill categories and requirements.
        </p>
      </div>

      {/* Error banner */}
      {createProject.isError && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>
            Failed to create project.{" "}
            {createProject.error instanceof Error
              ? createProject.error.message
              : "Please try again."}
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info card */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderPlus className="h-5 w-5" />
              Project Information
            </CardTitle>
            <CardDescription>
              Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label
                htmlFor="project-name"
                className="text-sm font-medium leading-none"
              >
                Project Name *
              </label>
              <Input
                id="project-name"
                placeholder="e.g. E-Commerce Platform Redesign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Platform */}
            <div className="space-y-2">
              <label
                htmlFor="project-platform"
                className="text-sm font-medium leading-none"
              >
                Platform *
              </label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="project-platform">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label
                htmlFor="project-description"
                className="text-sm font-medium leading-none"
              >
                Description *
              </label>
              <textarea
                id="project-description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Brief description of the project and its goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Skill categories section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Skill Categories
              </h2>
              <p className="text-sm text-muted-foreground">
                Define the skill categories and requirements for this project.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={addCategory}>
              <Plus className="mr-1 h-4 w-4" />
              Add Category
            </Button>
          </div>

          {categories.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No categories yet. Click &quot;Add Category&quot; to define skill
                requirements.
              </p>
            </div>
          )}

          {categories.map((category, ci) => (
            <CategoryBlock
              key={ci}
              category={category}
              index={ci}
              onChange={(updated) => updateCategory(ci, updated)}
              onRemove={() => removeCategory(ci)}
            />
          ))}
        </div>

        <Separator />

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={!isValid || createProject.isPending}
          >
            {createProject.isPending ? "Creating..." : "Create Project"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/projects">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
