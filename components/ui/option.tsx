type OptionProps = {
  value?: string | number | readonly string[];
  label?: string;
  disabled?: boolean;
  selected?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function Option(props: OptionProps) {
  return <option {...props} />;
}
