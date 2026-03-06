import { RICH_PARTS as P } from '../parts';

export function ControlRoomPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div data-part={P.crPanel}>
      <div data-part={P.crPanelHeader}>{title}</div>
      <div data-part={P.crPanelBody}>{children}</div>
    </div>
  );
}
