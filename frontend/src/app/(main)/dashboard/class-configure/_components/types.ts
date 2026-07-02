/**
 * A GroupConfig holds which sections are assigned to ONE specific group.
 * An empty sectionIds array means this group has no sections (one classroom).
 */
export type GroupConfig = {
  groupId: string;
  sectionIds: string[];
};

/**
 * Per-class configuration.
 *
 * If groupsOn = false → the class is undivided (no streams/groups).
 *   noGroupSectionIds controls sections for the single undivided classroom.
 *
 * If groupsOn = true → each group has its own list of sections independently.
 *   The flat sectionIds concept is GONE — each GroupConfig carries its own.
 */
export type ClassConfig = {
  groupsOn: boolean;
  groups: GroupConfig[];            // Only meaningful when groupsOn = true
  noGroupSectionIds: string[];      // Only meaningful when groupsOn = false
};
