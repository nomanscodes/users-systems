"use client";

import { SimpleNameTab } from "./simple-name-tab";
import { useSections, useCreateSection, useUpdateSection, useDeleteSection } from "../../hooks/use-sections";

export function SectionsTab() {
  const { data: sections = [], isLoading: loadingSections } = useSections();
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();

  return (
    <SimpleNameTab
      entityLabel="Section"
      placeholderExample="Section A"
      items={sections}
      isLoading={loadingSections}
      createMutation={createSection}
      updateMutation={updateSection}
      deleteMutation={deleteSection}
    />
  );
}
