/**
 * Библиотека контролов, которые реализуют содержимое всплывающих окон.
 * @library Controls/popupTemplate
 * @includes CloseButton Controls/_popupTemplate/CloseButton
 * @includes Stack Controls/_popupTemplate/Stack
 * @includes Header wml!Controls/_popupTemplate/Stack/resources/Header
 * @includes Dialog Controls/_popupTemplate/Dialog
 * @includes Confirmation Controls/popupConfirmation
 * @includes InfoBox Controls/_popupTemplate/InfoBox
 * @includes Notification Controls/_popupTemplate/Notification/Base
 * @includes NotificationSimple Controls/_popupTemplate/Notification/Simple
 * @includes NotificationStyles Controls/_popupTemplate/Notification/NotificationStyles
 * @includes INotification Controls/_popupTemplate/Notification/interface/INotification
 * @includes CloseButtonStyles Controls/_popupTemplate/CloseButton/CloseButtonStyles
 * @public
 * @author Крайнов Д.О.
 */
/*
 * popupTemplate library
 * @library Controls/popupTemplate
 * @includes CloseButton Controls/_popupTemplate/CloseButton
 * @includes Stack Controls/_popupTemplate/Stack
 * @includes StackHeader wml!Controls/_popupTemplate/Stack/resources/Header
 * @includes Dialog Controls/_popupTemplate/Dialog
 * @includes Confirmation Controls/popupConfirmation
 * @includes InfoBox Controls/_popupTemplate/InfoBox
 * @includes Notification Controls/_popupTemplate/Notification/Base
 * @includes NotificationSimple Controls/_popupTemplate/Notification/Simple
 * @includes NotificationStyles Controls/_popupTemplate/Notification/NotificationStyles
 * @includes CloseButtonStyles Controls/_popupTemplate/CloseButton/CloseButtonStyles
 * @public
 * @author Крайнов Д.О.
 */

import CloseButton = require('Controls/_popupTemplate/CloseButton');
import Stack = require('Controls/_popupTemplate/Stack');
import StackHeader = require('wml!Controls/_popupTemplate/Stack/resources/Header');
import Dialog = require('Controls/_popupTemplate/Dialog');
import { Template as Confirmation, DialogTemplate as ConfirmationDialog } from 'Controls/popupConfirmation';
import InfoBox = require('Controls/_popupTemplate/InfoBox');
export {default as Notification} from 'Controls/_popupTemplate/Notification/Base';
export {default as NotificationSimple} from 'Controls/_popupTemplate/Notification/Simple';

import {default as BaseController} from 'Controls/_popupTemplate/BaseController';
import DialogController = require('Controls/_popupTemplate/Dialog/Opener/DialogController');
import StickyController = require('Controls/_popupTemplate/Sticky/StickyController');
import InfoBoxController = require('Controls/_popupTemplate/InfoBox/Opener/InfoBoxController');
import StackController = require('Controls/_popupTemplate/Stack/Opener/StackController');
import StackContent = require('Controls/_popupTemplate/Stack/Opener/StackContent');
import TargetCoords = require('Controls/_popupTemplate/TargetCoords');
import NotificationController = require('Controls/_popupTemplate/Notification/Opener/NotificationController');
import PreviewerController = require('Controls/_popupTemplate/Previewer/PreviewerController');
import templateInfoBox = require('Controls/_popupTemplate/InfoBox/Opener/resources/template');
import {default as INotification, INotificationOptions} from 'Controls/_popupTemplate/Notification/interface/INotification';

import StackStrategy = require('Controls/_popupTemplate/Stack/Opener/StackStrategy');

export {
   CloseButton,
   Stack,
   StackHeader,
   Dialog,
   Confirmation,
   InfoBox,

   BaseController,
   ConfirmationDialog,
   DialogController,
   StickyController,
   StackContent,
   InfoBoxController,
   StackController,
   TargetCoords,
   NotificationController,
   PreviewerController,
   templateInfoBox,
    INotification,
    INotificationOptions,

   StackStrategy
};
