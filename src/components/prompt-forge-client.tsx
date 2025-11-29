"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import {
  Copy,
  Plus,
  Trash2,
  Upload,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Variable = {
  id: string;
  key: string;
  value: string;
};

const neumorphicCard =
  "bg-background rounded-2xl shadow-[7px_7px_15px_#e2e7eb,-7px_-7px_15px_#ffffff]";
const neumorphicButtonPressed =
  "shadow-[inset_5px_5px_10px_#e2e7eb,inset_-5px_-5px_10px_#ffffff]";
const neumorphicInput =
  "bg-background border-none rounded-lg shadow-[inset_3px_3px_7px_#e2e7eb,inset_-3px_-3px_7px_#ffffff] focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-0";

export default function PromptForgeClient() {
  const { toast } = useToast();
  const [template, setTemplate] = useState(
    "Your task is to {{task}}. Your main goal is to {{goal}} for the target audience of {{audience}}."
  );
  const [variables, setVariables] = useState<Variable[]>([
    { id: "1", key: "task", value: "write a marketing email" },
    { id: "2", key: "goal", value: "increase user engagement" },
    { id: "3", key: "audience", value: "young professionals" },
  ]);
  const [renderedPrompt, setRenderedPrompt] = useState("");
  const [isClient, setIsClient] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let newPrompt = template;
    variables.forEach((v) => {
      if (v.key) {
        const regex = new RegExp(`{{\\s*${v.key.trim()}\\s*}}`, "g");
        newPrompt = newPrompt.replace(regex, v.value);
      }
    });
    setRenderedPrompt(newPrompt);
  }, [template, variables]);

  const addVariable = () => {
    if (isClient) {
      setVariables([...variables, { id: crypto.randomUUID(), key: "", value: "" }]);
    }
  };

  const updateVariable = (id: string, field: "key" | "value", val: string) => {
    setVariables(
      variables.map((v) => (v.id === id ? { ...v, [field]: val } : v))
    );
  };

  const deleteVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(renderedPrompt).then(
      () => {
        toast({
          title: "Copied to clipboard!",
          description: "The rendered prompt has been copied.",
        });
      },
      (err) => {
        toast({
          variant: "destructive",
          title: "Failed to copy",
          description: "Could not copy prompt to clipboard.",
        });
      }
    );
  };

  const handleExport = () => {
    const data = {
      template,
      variables,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "prompt-forge-config.json";
    link.click();
  };

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") {
          throw new Error("Invalid file content");
        }
        const data = JSON.parse(text);

        if (data.template && Array.isArray(data.variables)) {
          setTemplate(data.template);
          // ensure imported variables have unique IDs
          setVariables(data.variables.map((v: Partial<Variable>) => ({
            id: isClient ? crypto.randomUUID() : Math.random().toString(),
            key: v.key || "",
            value: v.value || "",
          })));
          toast({
            title: "Import Successful",
            description: "Prompt and variables have been loaded.",
          });
        } else {
          throw new Error("Invalid JSON structure");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Import Failed",
          description:
            error instanceof Error ? error.message : "Could not parse JSON file.",
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const NeumorphicButton = ({
    children,
    className,
    ...props
  }: React.ComponentProps<typeof Button>) => (
    <Button
      className={cn(
        "bg-background text-foreground/80 rounded-lg transition-all duration-200 ease-in-out",
        "shadow-[5px_5px_10px_#e2e7eb,-5px_-5px_10px_#ffffff]",
        "active:shadow-[inset_5px_5px_10px_#e2e7eb,inset_-5px_-5px_10px_#ffffff] active:scale-[0.98]",
        "hover:text-accent hover:shadow-[2px_2px_5px_#e2e7eb,-2px_-2px_5px_#ffffff]",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-12">
        <h1 className="text-4xl font-bold text-foreground/80 font-headline mb-4 sm:mb-0">
          Prompt<span className="text-accent">Forge</span>
        </h1>
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
            accept=".json"
          />
          <NeumorphicButton onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </NeumorphicButton>
          <NeumorphicButton onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </NeumorphicButton>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-8">
          <Card className={cn(neumorphicCard, "border-none")}>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-foreground/80">
                Prompt Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="your task is {{task}}..."
                className={cn(neumorphicInput, "min-h-[150px] text-base")}
              />
            </CardContent>
          </Card>

          <Card className={cn(neumorphicCard, "border-none")}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-semibold text-foreground/80">
                Variables
              </CardTitle>
              <NeumorphicButton size="sm" onClick={addVariable}>
                <Plus className="mr-2 h-4 w-4" /> Add
              </NeumorphicButton>
            </CardHeader>
            <CardContent className="space-y-4">
              {variables.map((variable, index) => (
                <div key={variable.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Key"
                    value={variable.key}
                    onChange={(e) =>
                      updateVariable(variable.id, "key", e.target.value)
                    }
                    className={cn(neumorphicInput)}
                    aria-label={`Variable key ${index + 1}`}
                  />
                  <Input
                    placeholder="Value"
                    value={variable.value}
                    onChange={(e) =>
                      updateVariable(variable.id, "value", e.target.value)
                    }
                    className={cn(neumorphicInput)}
                    aria-label={`Variable value ${index + 1}`}
                  />
                  <NeumorphicButton
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteVariable(variable.id)}
                    className="aspect-square h-10 w-10 shrink-0"
                     aria-label={`Delete variable ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </NeumorphicButton>
                </div>
              ))}
              {variables.length === 0 && (
                <p className="text-center text-muted-foreground pt-4">
                  No variables defined. Click 'Add' to create one.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky top-8 self-start">
          <Card className={cn(neumorphicCard, "border-none")}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-semibold text-foreground/80">
                Rendered Prompt
              </CardTitle>
              <NeumorphicButton size="sm" onClick={copyToClipboard}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </NeumorphicButton>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  neumorphicInput,
                  "min-h-[300px] w-full whitespace-pre-wrap rounded-lg p-4 text-sm"
                )}
              >
                {renderedPrompt}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}