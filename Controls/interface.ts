/**
 * library with common interfaces
 * @library Controls/interface
 * @includes ITooltip Controls/_interface/ITooltip
 * @includes IButton Controls/_interface/IButton
 * @includes IIconStyle Controls/_interface/IIconStyle
 * @includes ICaption Controls/_interface/ICaption
 * @includes IIcon Controls/_interface/IIcon
 * @includes ISource Controls/_interface/ISource
 * @includes ISingleSelectable Controls/_interface/ISingleSelectable
 * @includes IDraggableBorders Controls/_interface/IDraggableBorders
 * @includes ICoordinate Controls/_interface/ICoordinate
 * @public
 * @author Kraynov D.
 */
export {default as ITooltip, ITooltipOptions} from './_interface/ITooltip';
export {default as IButton, IButtonOptions} from './_interface/IButton';
export {default as IIconStyle, IIconStyleOptions} from './_interface/IIconStyle';
export {default as ICaption, ICaptionOptions} from './_interface/ICaption';
export {default as IIcon, IIconOptions} from './_interface/IIcon';
export {default as ISingleSelectable, ISingleSelectableOptions} from './_interface/ISingleSelectable';
export {default as IDraggableBorders, IDraggableBordersOptions, Border} from './_interface/IDraggableBorders';
export {default as ICoordinate} from './_interface/ICoordinate';
