import { Geo2dModal, Geo3dModal } from './GeometryModal'
import { GraphToolModal } from './GraphToolModal'
import { NumberLineModal, TreeModal, TrigModal, VennModal, GroupedModal } from './MoreToolModals'
import { GasModal, SceneModal } from './MoreToolModals'
import {
  ChemGraphModal,
  CircuitModal,
  ElectronModal,
  InclineModal,
  MotionModal,
  StructModal,
  OxyModal,
  SignTableModal,
  StatsModal,
  TableModal,
} from './MoreToolModals'
import { ChemEqModal } from './MoreToolModals'
import { PhaseModal } from './MoreToolModals'
import { OscModal } from './MoreToolModals'
import { LensModal } from './MoreToolModals'
import { PedigreeModal } from './MoreToolModals'
import { PunnettModal } from './MoreToolModals'
import { FoodWebModal } from './MoreToolModals'
import { FieldModal } from './MoreToolModals'
import { ClockModal, ObjectsModal } from './objectsModals'
import { VarTableModal } from './VarTableModal'

import type { ChemGraphSpec, ElectronSpec, StructSpec } from '@/engine/lib/chem'
import type { ChemEqSpec } from '@/engine/lib/chemEq'
import type { CircuitSpec } from '@/engine/lib/circuit'
import type { FieldSpec } from '@/engine/lib/field'
import type { FoodWebSpec } from '@/engine/lib/foodweb'
import type { GasSpec } from '@/engine/lib/gas'
import type { Geo2dSpec, Geo3dSpec } from '@/engine/lib/geometry'
import type { GroupedSpec } from '@/engine/lib/grouped'
import type { LensSpec } from '@/engine/lib/lens'
import type { NumberLineSpec, TreeSpec, TrigSpec, VennSpec } from '@/engine/lib/mathExtra'
import type { ClockSpec, ObjectsSpec } from '@/engine/lib/objects'
import type { OscSpec } from '@/engine/lib/oscillation'
import type { OxySpec } from '@/engine/lib/oxy'
import type { PedigreeSpec } from '@/engine/lib/pedigree'
import type { PhaseSpec } from '@/engine/lib/phaseChange'
import type { InclineSpec, MotionSpec } from '@/engine/lib/physics'
import type { PlotSpec } from '@/engine/lib/plot'
import type { PunnettSpec } from '@/engine/lib/punnett'
import type { SceneSpec } from '@/engine/lib/scene'
import type { SignTableSpec } from '@/engine/lib/signTable'
import type { StatsSpec } from '@/engine/lib/stats'
import type { TableSpec } from '@/engine/lib/table'
/**
 * Mở đúng modal của công cụ theo `kind`. `initial` là cấu hình cũ (nhấp đúp ảnh
 * để sửa, hoặc AI điền sẵn).
 */
import type { ToolDoc, ToolImage, ToolKind } from '@/engine/lib/toolSpec'
import type { VarTableSpec } from '@/engine/lib/varTable'

export function ToolModal({
  kind,
  initial,
  submitLabel,
  onClose,
  onInsert,
}: {
  kind: ToolKind
  initial?: ToolDoc['spec'] | null
  submitLabel?: string
  onClose: () => void
  onInsert: (img: ToolImage) => void
}) {
  const common = { submitLabel, onClose, onInsert }
  switch (kind) {
    case 'graph':
      return <GraphToolModal initial={initial as PlotSpec | null | undefined} {...common} />
    case 'vartable':
      return <VarTableModal initial={initial as VarTableSpec | null | undefined} {...common} />
    case 'geo2d':
      return <Geo2dModal initial={initial as Geo2dSpec | null | undefined} {...common} />
    case 'geo3d':
      return <Geo3dModal initial={initial as Geo3dSpec | null | undefined} {...common} />
    case 'signtable':
      return <SignTableModal initial={initial as SignTableSpec | null | undefined} {...common} />
    case 'oxy':
      return <OxyModal initial={initial as OxySpec | null | undefined} {...common} />
    case 'stats':
      return <StatsModal initial={initial as StatsSpec | null | undefined} {...common} />
    case 'circuit':
      return <CircuitModal initial={initial as CircuitSpec | null | undefined} {...common} />
    case 'motion':
      return <MotionModal initial={initial as MotionSpec | null | undefined} {...common} />
    case 'scene':
      return <SceneModal initial={initial as SceneSpec | null | undefined} {...common} />
    case 'gas':
      return <GasModal initial={initial as GasSpec | null | undefined} {...common} />
    case 'incline':
      return <InclineModal initial={initial as InclineSpec | null | undefined} {...common} />
    case 'electron':
      return <ElectronModal initial={initial as ElectronSpec | null | undefined} {...common} />
    case 'struct':
      return <StructModal initial={initial as StructSpec | null | undefined} {...common} />
    case 'chemgraph':
      return <ChemGraphModal initial={initial as ChemGraphSpec | null | undefined} {...common} />
    case 'chemeq':
      return <ChemEqModal initial={initial as ChemEqSpec | null | undefined} {...common} />
    case 'trig':
      return <TrigModal initial={initial as TrigSpec | null | undefined} {...common} />
    case 'probtree':
      return <TreeModal initial={initial as TreeSpec | null | undefined} {...common} />
    case 'numberline':
      return <NumberLineModal initial={initial as NumberLineSpec | null | undefined} {...common} />
    case 'venn':
      return <VennModal initial={initial as VennSpec | null | undefined} {...common} />
    case 'grouped':
      return <GroupedModal initial={initial as GroupedSpec | null | undefined} {...common} />
    case 'table':
      return <TableModal initial={initial as TableSpec | null | undefined} {...common} />
    case 'phase':
      return <PhaseModal initial={initial as PhaseSpec | null | undefined} {...common} />
    case 'osc':
      return <OscModal initial={initial as OscSpec | null | undefined} {...common} />
    case 'lens':
      return <LensModal initial={initial as LensSpec | null | undefined} {...common} />
    case 'pedigree':
      return <PedigreeModal initial={initial as PedigreeSpec | null | undefined} {...common} />
    case 'punnett':
      return <PunnettModal initial={initial as PunnettSpec | null | undefined} {...common} />
    case 'foodweb':
      return <FoodWebModal initial={initial as FoodWebSpec | null | undefined} {...common} />
    case 'field':
      return <FieldModal initial={initial as FieldSpec | null | undefined} {...common} />
    case 'objects':
      return <ObjectsModal initial={initial as ObjectsSpec | null | undefined} {...common} />
    case 'clock':
      return <ClockModal initial={initial as ClockSpec | null | undefined} {...common} />
  }
}
