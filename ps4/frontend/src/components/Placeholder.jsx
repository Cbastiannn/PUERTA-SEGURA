import { T, F } from "../utils";
import { Spinner } from "./UI";
export default function Placeholder({ name = 'Módulo' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
      <div style={{ fontSize: 48, opacity: .15 }}>🚧</div>
      <div style={{ fontFamily: F.mono, fontSize: 12, color: T.muted }}>Cargando módulo...</div>
      <Spinner />
    </div>
  );
}
