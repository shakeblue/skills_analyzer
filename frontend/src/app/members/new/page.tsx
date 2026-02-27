"use client";

import * as React from "react";
import Link from "next/link";
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
import {
  ArrowLeft,
  Upload,
  FileText,
  Code2,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEPARTMENTS = ["Engineering", "DevOps", "Design", "Management"] as const;

const CV_ACCEPT = ".pdf,.docx";
const CODE_ACCEPT = ".zip";

// ---------------------------------------------------------------------------
// Dropzone component (visual only)
// ---------------------------------------------------------------------------

interface DropzoneProps {
  label: string;
  description: string;
  accept: string;
  icon: React.ElementType;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

function Dropzone({
  label,
  description,
  accept,
  icon: Icon,
  file,
  onFileChange,
}: DropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      onFileChange(dropped);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    onFileChange(selected);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">{label}</label>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label} dropzone. Click or drag and drop to upload.`}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100",
          file && "border-emerald-300 bg-emerald-50",
        )}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleInputChange}
          aria-hidden="true"
          tabIndex={-1}
        />

        {file ? (
          <>
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="mt-2 text-sm font-medium text-emerald-700">
              {file.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <button
              type="button"
              className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
              }}
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <Icon className="h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-600">
              Drop file here or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success toast banner
// ---------------------------------------------------------------------------

function SuccessBanner({ name }: { name: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0" />
      <p>
        <strong>{name}</strong> has been added successfully. Skill analysis will
        begin once documents are processed.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function NewMemberPage() {
  const [name, setName] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [role, setRole] = React.useState("");
  const [githubUrl, setGithubUrl] = React.useState("");
  const [cvFile, setCvFile] = React.useState<File | null>(null);
  const [codeFile, setCodeFile] = React.useState<File | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [submittedName, setSubmittedName] = React.useState("");

  const isValid = name.trim().length > 0 && department.length > 0 && role.trim().length > 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) return;

    // Phase 1: UI only -- show success, do not call backend
    setSubmittedName(name.trim());
    setSubmitted(true);

    // Reset form
    setName("");
    setDepartment("");
    setRole("");
    setGithubUrl("");
    setCvFile(null);
    setCodeFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/members">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Members
        </Link>
      </Button>

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Add New Member
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a team member and upload their documents for skill analysis.
        </p>
      </div>

      {/* Success banner */}
      {submitted && <SuccessBanner name={submittedName} />}

      {/* Form card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5" />
            Member Information
          </CardTitle>
          <CardDescription>
            Fill in the details below. Fields marked with * are required.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="member-name" className="text-sm font-medium leading-none">
                Name *
              </label>
              <Input
                id="member-name"
                placeholder="e.g. Jane Smith"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (submitted) setSubmitted(false);
                }}
                required
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label htmlFor="member-department" className="text-sm font-medium leading-none">
                Department *
              </label>
              <Select
                value={department}
                onValueChange={(value) => {
                  setDepartment(value);
                  if (submitted) setSubmitted(false);
                }}
              >
                <SelectTrigger id="member-department">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label htmlFor="member-role" className="text-sm font-medium leading-none">
                Role *
              </label>
              <Input
                id="member-role"
                placeholder="e.g. Senior Frontend Engineer"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  if (submitted) setSubmitted(false);
                }}
                required
              />
            </div>

            {/* GitHub URL */}
            <div className="space-y-2">
              <label htmlFor="member-github" className="text-sm font-medium leading-none">
                GitHub URL
              </label>
              <Input
                id="member-github"
                type="url"
                placeholder="https://github.com/username"
                value={githubUrl}
                onChange={(e) => {
                  setGithubUrl(e.target.value);
                  if (submitted) setSubmitted(false);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Used to analyze public repositories for skill
                extraction.
              </p>
            </div>

            <Separator />

            {/* Upload areas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Document Uploads
              </h3>
              <p className="text-xs text-muted-foreground">
                Upload a CV and/or source code archive for automated skill
                extraction. These uploads are visual placeholders for Phase 1.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Dropzone
                  label="CV / Resume"
                  description="Accepts .pdf, .docx"
                  accept={CV_ACCEPT}
                  icon={FileText}
                  file={cvFile}
                  onFileChange={(f) => {
                    setCvFile(f);
                    if (submitted) setSubmitted(false);
                  }}
                />
                <Dropzone
                  label="Source Code"
                  description="Accepts .zip"
                  accept={CODE_ACCEPT}
                  icon={Code2}
                  file={codeFile}
                  onFileChange={(f) => {
                    setCodeFile(f);
                    if (submitted) setSubmitted(false);
                  }}
                />
              </div>
            </div>

            <Separator />

            {/* Submit */}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!isValid}>
                <Upload className="mr-1 h-4 w-4" />
                Add Member
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/members">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
