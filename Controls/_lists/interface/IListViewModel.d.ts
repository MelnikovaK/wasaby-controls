import { IItemAction } from 'Controls/_lists/Swipe/interface/IItemAction';
// @ts-ignore
import { Model } from 'Types/entity';

export interface IItemData {
   item: Model;
   itemActions: {
      all: IItemAction[];
      showed: IItemAction[];
   };
}

export interface IListModel {
   getSwipeItem: () => IItemData;
   nextModelVersion: (notUpdatePrefixItemVersion?: boolean) => void;
   setSwipeItem: (itemData: IItemData) => void;
   setActiveItem: (itemData: IItemData) => void;
   setItemActions: (
      item: Model,
      actions: {
         all: IItemAction[];
         showed: IItemAction[];
      }
   ) => void;
   subscribe: (eventName: string, handler: Function) => void;
}
