import { SbisService, PrefetchProxy } from 'Types/source';
import { relation } from 'Types/entity';
import { Collection } from 'Controls/display';
import { ListViewModel } from 'Controls/list';
import { TKeySelection as TKey, TKeysSelection as TKeys, ISelectionObject as ISelection } from 'Controls/_interface/ISelectionType';

export interface ISelectionConfig {
   selectedKeys: TKeys,
   excludedKeys: TKeys,
   model: Collection|ListViewModel,
   limit?: number,
   filter?: Object,
   source?: SbisService|PrefetchProxy
   hierarchyRelation?: relation.Hierarchy
}

export interface ISelectionStrategyOptions {
   selectionCountMethodName?: string
}

// параметры hierarchyRelation и keyProperty нужен для поддержки старой модели, с полным переходом на новую они уйдут
export default interface ISelectionStrategy {
   select(keys: TKeys, selectedKeys: TKeys, excludedKeys: TKeys, model?: Collection|ListViewModel, hierarchyRelation?: relation.Hierarchy): ISelection;
   unSelect(keys: TKeys, selectedKeys: TKeys, excludedKeys: TKeys, model?: Collection|ListViewModel, hierarchyRelation?: relation.Hierarchy): ISelection;
   getCount(config: ISelectionConfig): Promise<number|null>;
   getSelectionForModel(selectedKeys: TKeys, excludedKeys: TKeys, model: Collection|ListViewModel, limit?: number, keyProperty?: string, hierarchyRelation?: relation.Hierarchy): Map<TKey, boolean|null>;
   isAllSelected(folderId: Tkey, selectedKeys: TKeys, excludedKeys?: TKeys, model?: Collection|ListViewModel, hierarchyRelation?: relation.Hierarchy): boolean;
}
