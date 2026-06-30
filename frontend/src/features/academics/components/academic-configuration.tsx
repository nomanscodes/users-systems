"use client";

import { Building2, CalendarDays, GraduationCap, Layers, Users, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PageContainer } from "@/components/page-container";

import { BranchesTab } from "./tabs/branches-tab";
import { SessionsTab } from "./tabs/sessions-tab";
import { ClassesTab } from "./tabs/classes-tab";
import { SimpleNameTab } from "./tabs/simple-name-tab";
import { SubjectsTab } from "./tabs/subjects-tab";

import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup } from "../hooks/use-groups";
import { useSections, useCreateSection, useUpdateSection, useDeleteSection } from "../hooks/use-sections";

const tabs = [
  { value: "branches", label: "Branches", icon: Building2 },
  { value: "sessions", label: "Sessions", icon: CalendarDays },
  { value: "classes", label: "Classes", icon: GraduationCap },
  { value: "groups", label: "Groups", icon: Layers },
  { value: "sections", label: "Sections", icon: Users },
  { value: "subjects", label: "Subjects", icon: BookOpen },
] as const;

export function AcademicConfiguration() {
  const { data: groups = [], isLoading: loadingGroups } = useGroups();
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();

  const { data: sections = [], isLoading: loadingSections } = useSections();
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();

  return (
    <PageContainer>
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Academic Configuration
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage the foundational structure of your institution — branches, academic
          sessions, classes, groups, sections, and subjects — all from one place.
        </p>
      </div>

      <Tabs defaultValue="branches" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="h-auto w-full justify-start gap-1 rounded-lg border bg-card p-1">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
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
          <SimpleNameTab
            entityLabel="Group"
            placeholderExample="Science"
            items={groups}
            isLoading={loadingGroups}
            createMutation={createGroup}
            updateMutation={updateGroup}
            deleteMutation={deleteGroup}
          />
        </TabsContent>
        <TabsContent value="sections" className="mt-0">
          <SimpleNameTab
            entityLabel="Section"
            placeholderExample="Section A"
            items={sections}
            isLoading={loadingSections}
            createMutation={createSection}
            updateMutation={updateSection}
            deleteMutation={deleteSection}
          />
        </TabsContent>
        <TabsContent value="subjects" className="mt-0">
          <SubjectsTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
