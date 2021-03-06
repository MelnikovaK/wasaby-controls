/**
 * Библиотека контролов, которые служат для задания набора шаблонов, из которых в каждый момент времени может отображаться только один, с возможностью переключения между этими шаблонами.
 * @library Controls/tabs
 * @includes Buttons Controls/_tabs/Buttons
 * @public
 * @author Крайнов Д.О.
 */

/*
 * tabs library
 * @library Controls/tabs
 * @includes Buttons Controls/_tabs/Buttons
 * @public
 * @author Крайнов Д.О.
 */

import Buttons = require('Controls/_tabs/Buttons');
import buttonsItemTemplate = require('wml!Controls/_tabs/Buttons/ItemTemplate');

export {
   Buttons,
   buttonsItemTemplate
}
