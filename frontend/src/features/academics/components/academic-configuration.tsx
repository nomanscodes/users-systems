"use client";

import { Building2, CalendarDays, GraduationCap, Layers, Users, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PageContainer } from "@/components/page-container";
import { useQueryTabs } from "@/hooks/use-query-tabs";

import { BranchesTab } from "./tabs/branches-tab";
import { SessionsTab } from "./tabs/sessions-tab";
import { ClassesTab } from "./tabs/classes-tab";
import { GroupsTab } from "./tabs/groups-tab";
import { SectionsTab } from "./tabs/sections-tab";
import { SubjectsTab } from "./tabs/subjects-tab";

const tabs = [
  { value: "branches", label: "Branches", icon: Building2 },
  { value: "sessions", label: "Sessions", icon: CalendarDays },
  { value: "classes", label: "Classes", icon: GraduationCap },
  { value: "groups", label: "Groups", icon: Layers },
  { value: "sections", label: "Sections", icon: Users },
  { value: "subjects", label: "Subjects", icon: BookOpen },
] as const;

export function AcademicConfiguration() {
  const [activeTab, setActiveTab] = useQueryTabs("branches");

  return (
    <PageContainer>
      {/* Page header */}
      <div className="flex flex-col mb-8">
        <div className="flex items-center text-[11px] font-bold tracking-widest text-muted-foreground/80 uppercase mb-3">
          <span>Academic Setup</span>
          <span className="mx-2 font-light">/</span>
          <span className="text-foreground/70">Configuration</span>
        </div>
        <h1 className="text-[2rem] font-bold tracking-tight text-foreground leading-tight">
          Academic Configuration
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground max-w-3xl">
          Manage the foundational structure of your institution — branches, academic
          sessions, classes, groups, sections, and subjects — all from one place.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="h-auto w-full justify-start gap-1 rounded-xl border border-border/50 bg-card p-1.5 shadow-sm">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="gap-2 px-5 py-2.5 rounded-lg font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
              >
                <t.icon className="size-4" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="branches" className="mt-0">
          <BranchesTab />
        </TabsContent>
        <TabsContent value="sessions" className="mt-0">
          <SessionsTab />
        </TabsContent>
        <TabsContent value="classes" className="mt-0">
          <ClassesTab />
        </TabsContent>
        <TabsContent value="groups" className="mt-0">
          <GroupsTab />
        </TabsContent>
        <TabsContent value="sections" className="mt-0">
          <SectionsTab />
        </TabsContent>
        <TabsContent value="subjects" className="mt-0">
          <SubjectsTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
