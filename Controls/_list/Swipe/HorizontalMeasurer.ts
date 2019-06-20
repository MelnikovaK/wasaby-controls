import { IMeasurer } from './interface/IMeasurer';
import { IItemAction, ShowType } from './interface/IItemAction';
import { ISwipeConfig, ItemActionsSize } from './interface/ISwipeConfig';
import { ISwipeControlOptions } from './interface/ISwipeControl';

const MAX_ACTIONS_COUNT = 3;
const HEIGHT_LOWER_BOUND_WITH_TITLE = 58;
const HEIGHT_LOWER_BOUND_WITHOUT_TITLE = 38;

type ActionCaptionPosition = Exclude<ISwipeControlOptions['actionCaptionPosition'], 'right'>;

function getItemActionsSize(
   rowHeight: number,
   actionCaptionPosition: ActionCaptionPosition
): ItemActionsSize {
   if (actionCaptionPosition !== 'none') {
      return rowHeight < HEIGHT_LOWER_BOUND_WITH_TITLE ? 'm' : 'l';
   } else {
      return rowHeight < HEIGHT_LOWER_BOUND_WITHOUT_TITLE ? 'm' : 'l';
   }
}

const HorizontalMeasurer: IMeasurer = {
   getSwipeConfig(
      actions: IItemAction[],
      rowHeight: number,
      actionCaptionPosition: ActionCaptionPosition
   ): ISwipeConfig {
      let itemActions = actions.slice();
      itemActions.sort(function(action1, action2) {
         return action2.showType - action1.showType;
      });
      if (itemActions.length > MAX_ACTIONS_COUNT) {
         itemActions = itemActions.slice(0, MAX_ACTIONS_COUNT);
         itemActions.push({
            icon: 'icon-SwipeMenu',
            title: rk('Ещё'),
            _isMenu: true,
            showType: ShowType.TOOLBAR
         });
      }

      return {
         itemActionsSize: getItemActionsSize(rowHeight, actionCaptionPosition),
         itemActions: {
            all: actions,
            showed: itemActions
         },
         paddingSize: 'm'
      };
   },
   needIcon(
      action: IItemAction,
      actionCaptionPosition: ActionCaptionPosition,
      hasActionWithIcon: boolean = false
   ): boolean {
      return !!action.icon || (hasActionWithIcon && actionCaptionPosition !== 'none');
   },
   needTitle(action: IItemAction, actionCaptionPosition: ActionCaptionPosition): boolean {
      return !action.icon || (actionCaptionPosition !== 'none' && !!action.title);
   }
};

export default HorizontalMeasurer;
