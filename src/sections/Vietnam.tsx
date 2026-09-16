import { useHashRoute } from '../ui/hashRoute';
import type { SectionId } from '../types';
import VietnamWorkspace from './VietnamWorkspace';
import './vietnam-workspace.css';

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
}

/** Рабочая оболочка Вьетнама отделяет стартовые национальные сигналы от
 * подробного каталога, чтобы локальный срез не выглядел общенациональным. */
export default function Vietnam(props: Props) {
  const route = useHashRoute();
  return <VietnamWorkspace {...props} route={route} />;
}
