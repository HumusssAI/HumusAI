import LabMenu from "./LabMenu";

export default function LaboratorioLayout({ children }) {
  return (
    <>
      <LabMenu />
      {children}
    </>
  );
}