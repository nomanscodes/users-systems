"use client";

import { SimpleNameTab } from "./simple-name-tab";
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup } from "../../hooks/use-groups";

export function GroupsTab() {
  const { data: groups = [], isLoading: loadingGroups } = useGroups();
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();

  return (
    <SimpleNameTab
      entityLabel="Group"
      placeholderExample="Science"
      items={groups}
      isLoading={loadingGroups}
      createMutation={createGroup}
      updateMutation={updateGroup}
      deleteMutation={deleteGroup}
    />
  );
}
