import type { ReactNode } from "react";

type LayoutTagName = "section" | "div" | "p" | "span";

type ClassTaggedProps = {
  as?: LayoutTagName;
  className: string;
  children: ReactNode;
  id?: string;
  role?: string;
  tabIndex?: number;
  title?: string;
  "aria-label"?: string;
};

type TaggedLayoutProps = {
  as?: LayoutTagName;
  children: ReactNode;
  id?: string;
  role?: string;
  tabIndex?: number;
  title?: string;
  "aria-label"?: string;
};

function ClassTagged(props: ClassTaggedProps): ReactNode {
  const Tag = props.as ?? "div";
  return (
    <Tag
      className={props.className}
      id={props.id}
      role={props.role}
      tabIndex={props.tabIndex}
      title={props.title}
      aria-label={props["aria-label"]}
    >
      {props.children}
    </Tag>
  );
}

export function createClassTagged(className: string, defaultAs: LayoutTagName) {
  return function TaggedLayout(props: TaggedLayoutProps): ReactNode {
    return (
      <ClassTagged
        as={props.as ?? defaultAs}
        className={className}
        id={props.id}
        role={props.role}
        tabIndex={props.tabIndex}
        title={props.title}
        aria-label={props["aria-label"]}
      >
        {props.children}
      </ClassTagged>
    );
  };
}
