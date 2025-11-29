"use client";

import { useState, useEffect, useRef, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import {
  Copy,
  Plus,
  Trash2,
  Upload,
  Download,
  GripVertical,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Variable = {
  id: string;
  key: string;
  value: string;
};

const retroCard = "bg-card border-accent/20 border-2 rounded-lg shadow-lg shadow-accent/10";
const retroInput = "bg-background border-primary/50 border rounded-none focus-visible:ring-primary focus-visible:ring-1 focus-visible:ring-offset-0 text-primary placeholder:text-primary/70 font-code";

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
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    setDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        const newVariables = [...variables];
        const draggedItemContent = newVariables.splice(dragItem.current, 1)[0];
        newVariables.splice(dragOverItem.current, 0, draggedItemContent);
        setVariables(newVariables);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDragging(false);
    setDragOverIndex(null);
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
  
  const RetroButton = ({
    children,
    className,
    ...props
  }: React.ComponentProps<typeof Button>) => (
    <Button
      variant="outline"
      className={cn(
        "bg-transparent border-2 border-accent text-accent rounded-none uppercase font-headline text-xs tracking-widest",
        "hover:bg-accent hover:text-background hover:shadow-[0_0_15px] hover:shadow-accent",
        "active:scale-[0.98]",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );


  return (
    <div className="container mx-auto p-4 sm:p-8 flex flex-col min-h-screen">
       <header className="flex flex-col sm:flex-row justify-between items-center mb-8 text-center">
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <Image
            src="https://objectstorageapi.ap-southeast-1.clawcloudrun.com/gmwlrt8t-data/keyboard_logo.png"
            width={80}
            height={80}
            alt="PromptForge Logo"
            className="filter invert"
          />
          <div>
            <h1 className="text-4xl font-headline text-primary" style={{ textShadow: '0 0 8px hsl(var(--primary))' }}>
              Prompt<span className="text-accent" style={{ textShadow: '0 0 8px hsl(var(--accent))' }}>Forge</span>
            </h1>
            <p className="font-code text-sm text-primary/80 mt-1">
              made by{" "}
              <a
                href="https://www.linkedin.com/in/jayll13"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                JayLL
              </a>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
            accept=".json"
          />
          <RetroButton onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </RetroButton>
          <RetroButton onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </RetroButton>
        </div>
      </header>

      <main className="flex-grow grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
        <Tabs defaultValue="template" className="w-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-transparent mb-4 p-0 gap-4">
            <TabsTrigger value="template" className="bg-card border-2 border-primary/50 rounded-none text-primary data-[state=active]:bg-primary data-[state=active]:text-background data-[state=active]:shadow-[0_0_15px] data-[state=active]:shadow-primary font-headline uppercase">Prompt Template</TabsTrigger>
            <TabsTrigger value="variables" className="bg-card border-2 border-primary/50 rounded-none text-primary data-[state=active]:bg-primary data-[state=active]:text-background data-[state=active]:shadow-[0_0_15px] data-[state=active]:shadow-primary font-headline uppercase">Variables</TabsTrigger>
          </TabsList>
          <TabsContent value="template" className="flex-grow">
            <Card className={cn(retroCard, "border-primary/50 shadow-primary/10 h-full flex flex-col")}>
              <CardContent className="p-6 flex-grow">
                <Textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="your task is {{task}}..."
                  className={cn(retroInput, "h-full w-full text-lg resize-none")}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="variables" className="flex-grow">
            <Card className={cn(retroCard, "border-primary/50 shadow-primary/10 h-full flex flex-col")}>
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <CardTitle className="text-2xl font-headline text-primary">
                  Variables
                </CardTitle>
                <RetroButton size="sm" onClick={addVariable}>
                  <Plus className="mr-2 h-4 w-4" /> Add
                </RetroButton>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2 overflow-y-auto pr-4 flex-grow">
                {variables.map((variable, index) => (
                  <div
                    key={variable.id}
                    className={cn(
                      "flex items-center gap-2 cursor-grab active:cursor-grabbing p-2 rounded-lg transition-all duration-300",
                      dragging && dragItem.current === index && "opacity-50 scale-95",
                      dragOverIndex === index && "bg-accent/20"
                    )}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                  >
                     <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Key"
                      value={variable.key}
                      onChange={(e) =>
                        updateVariable(variable.id, "key", e.target.value)
                      }
                      className={cn(retroInput)}
                      aria-label={`Variable key ${index + 1}`}
                    />
                    <Input
                      placeholder="Value"
                      value={variable.value}
                      onChange={(e) =>
                        updateVariable(variable.id, "value", e.target.value)
                      }
                      className={cn(retroInput)}
                      aria-label={`Variable value ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteVariable(variable.id)}
                      className="aspect-square h-10 w-10 shrink-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-none"
                       aria-label={`Delete variable ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {variables.length === 0 && (
                  <p className="text-center text-muted-foreground pt-4 font-code">
                    No variables defined. Click 'Add' to create one.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col">
          <Card className={cn(retroCard, "flex-grow flex flex-col")}>
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-2xl font-headline text-accent">
                Rendered Prompt
              </CardTitle>
              <RetroButton size="sm" onClick={copyToClipboard}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </RetroButton>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
              <div
                className={cn(
                  retroInput,
                  "w-full h-full whitespace-pre-wrap rounded-none p-4 text-lg"
                )}
              >
                {renderedPrompt}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="w-full mt-12 text-center text-muted-foreground font-code text-xs">
          <p>&copy; {new Date().getFullYear()} PromptForge. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-4">
            <span>Contact me:</span>
            <a href="https://www.linkedin.com/in/jayll13" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent hover:underline">
              LinkedIn
            </a>
            <a href="http://fb.com/jayllFA" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent hover:underline">
              Facebook
            </a>
          </div>
      </footer>
    </div>
  );
}
