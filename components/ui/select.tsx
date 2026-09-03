import {
  forwardRef,
  type ChangeEvent,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";

type SelectProps = {
  label?: string;
  className?: string;
  id?: string;
  name?: string;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  onFocus?: (event: FocusEvent<HTMLSelectElement>) => void;
  onBlur?: (event: FocusEvent<HTMLSelectElement>) => void;
  onClick?: (event: MouseEvent<HTMLSelectElement>) => void;
  "aria-label"?: string;
  children?: ReactNode;
};

function selectFieldView(label: string, id: string | undefined, control: ReactNode): ReactNode {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="control">{control}</div>
    </div>
  );
}

function selectControlView(ref: Ref<HTMLSelectElement>, props: SelectProps): ReactNode {
  const { label: _label, id, className, children, ...rest } = props;

  return (
    <div className="select is-fullwidth">
      <select ref={ref} id={id} className={className} {...rest}>
        {children}
      </select>
    </div>
  );
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  props,
  ref,
): ReactNode {
  const control = selectControlView(ref, props);

  if (!props.label) {
    return control;
  }

  return selectFieldView(props.label, props.id, control);
});
