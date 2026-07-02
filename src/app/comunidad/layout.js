import ComunidadAuthGate from "./ComunidadAuthGate.jsx";

export default function ComunidadLayout({ children }) {
  return <ComunidadAuthGate>{children}</ComunidadAuthGate>;
}