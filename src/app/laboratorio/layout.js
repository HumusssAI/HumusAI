import LabMenu from "./LabMenu";
import LaboratorioAuthGate from "./LaboratorioAuthGate.jsx";

export default function LaboratorioLayout({ children }) {
  return (
    <LaboratorioAuthGate>
      <LabMenu />
      {children}
    </LaboratorioAuthGate>
  );
}