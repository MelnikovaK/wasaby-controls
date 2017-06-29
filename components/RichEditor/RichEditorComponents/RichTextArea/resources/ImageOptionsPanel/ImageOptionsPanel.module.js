
define('js!SBIS3.CONTROLS.RichEditor.ImageOptionsPanel',
   [
      'js!SBIS3.CONTROLS.CompoundControl',
      'js!SBIS3.CONTROLS.PopupMixin',
      'js!SBIS3.CORE.FileStorageLoader',
      'js!WS.Data/Di',
      'Core/helpers/fast-control-helpers',
      'tmpl!SBIS3.CONTROLS.RichEditor.ImageOptionsPanel',
      'js!SBIS3.CONTROLS.RichEditor.ImagePanel',
      'js!SBIS3.CONTROLS.CommandsButton',
      'js!SBIS3.CONTROLS.Link',
      'css!SBIS3.CONTROLS.RichEditor.ImageOptionsPanel',
      'css!SBIS3.CONTROLS.Menu'
   ], function(CompoundControl, PopupMixin, FileStorageLoader, Di, fcHelpers, dotTplFn, ImagePanel) {
      'use strict';
      //todo: отказаться от этого модуля в 3.7.5.50 перейти на контекстное меню
      var
         imagePanelhOffset = 24,// 32 - 6 - 2*1?  height - input padding - 2 * border
         imagePanelhOffsetBottom = 4,// 6 - 2*1? input padding - 2 * border
         ImageOptionsPanel =  CompoundControl.extend([PopupMixin], {
            _dotTplFn: dotTplFn,
            $protected: {
               _options: {
                  richMode: false
               }
            },
            _replaceButton: undefined,
            _commandsButton: undefined,
            _imageViewer: undefined,
            _imagePanel: undefined,

            _modifyOptions: function(options) {
               options = ImageOptionsPanel.superclass._modifyOptions.apply(this, arguments);
               if (Di.isRegistered('ImageEditor')) {
                  options.richMode = this._options.target.attr('alt') !== ''; //если файлы грузили через fileStorageLoader, то не надо показывать редактор изображений
               }
               return options;
            },

            $constructor: function(){
               this._publish('onImageChange', 'onImageDelete', 'onImageSizeChange');
            },

            init: function(){
               ImageOptionsPanel.superclass.init.call(this);

               this._replaceButton = this.getChildControlByName('replaceButton');
               this._replaceButton.subscribe('onActivated', this._replaceButtonClickHandler.bind(this));
               this._commandsButton = this.getChildControlByName('commandsButton');
               this._commandsButton.subscribe('onMenuItemActivate', this._commandsButtonItemActivateHandler.bind(this));
            },

            recalcPosition: function() {
               ImageOptionsPanel.superclass.recalcPosition.apply(this, arguments);
               var
                  scrollContainer = this.getTarget().closest('.controls-ScrollContainer'),
                  linkedContainer = scrollContainer.length ? scrollContainer : this.getParent().getInputContainer(),
                  inputOffset = linkedContainer.offset().top,
                  panelOffset = this._container.offset().top,
                  inputHeight = linkedContainer.height();
               this._container.css('width',this.getTarget().width());
               this._container.css('max-width', this.getParent().getInputContainer().width() - imagePanelhOffset);
               this._container.css('height','32px'); // dich3000
               this._container.css('overflow-y','hidden'); // dich3000
               if (this._container.hasClass('controls-popup-revert-vertical')) {
                  if (panelOffset + imagePanelhOffset < inputOffset) {
                     this._container.css('top', inputOffset - imagePanelhOffset);
                  }
               } else {
                  if (panelOffset > inputOffset + inputHeight + imagePanelhOffsetBottom) {
                     this._container.css('top', inputOffset + inputHeight);
                  }
               }
            },

            getFileLoader: function() {
               return Di.resolve('ImageUploader').getFileLoader();
            },

            getEditor: function() {
               return Di.resolve('ImageEditor');
            },

            getImagePanel: function(button){
               var
                  self = this;
               if (!this._imagePanel) {
                  this._imagePanel = new ImagePanel({
                     windowTitle: 'Смена шаблона',
                     onlyTemplate: true,
                     parent: button,
                     target: button.getContainer(),
                     verticalAlign: {
                        side: 'top'
                     },
                     horizontalAlign: {
                        side: 'left',
                        offset: -100
                     },
                     element: $('<div></div>')
                  });
                  this._imagePanel.subscribe('onTemplateChange', function(event, template){
                     self._notify('onTemplateChange', template);
                     self._imagePanel.hide();
                  });
               }
               return this._imagePanel;
            },
            _openImagePanel: function(button){
               var
                  imagePanel = this.getImagePanel(button);
               imagePanel.show();
            },

            _replaceButtonClickHandler: function() {
               this.getFileLoader().startFileLoad(this._replaceButton._container, false, this._options.imageFolder).addCallback(function(fileobj){
                  this._notify('onImageChange', fileobj);
                  this.hide();
               }.bind(this));
            },

            _commandsButtonItemActivateHandler: function(event, key){
               switch (key) {
                  case "delete":
                     this._notify('onImageDelete');
                     this.hide();
                     break;
                  case "size":
                     this._notify('onImageSizeChange');
                     this.hide();
                     break;
                  case "change":
                     this.getFileLoader().startFileLoad(this._replaceButton._container, false, this._options.imageFolder).addCallback(function(fileobj){
                        this._notify('onImageChange', fileobj);
                        this.hide();
                     }.bind(this));
                     break;
                  case "template":
                     this._openImagePanel(this);
                     var
                        selection = window.getSelection ? window.getSelection() : null;
                     if (selection) {
                        selection.removeAllRanges();
                     }
                     break;
                  case "edit":
                     var
                        self = this;
                     this.getEditor().openFullScreenByFileId(this.getTarget().attr('alt')).addCallback(function(fileobj){
                        self._notify('onImageChange', fileobj);
                     });
                     this.hide();
                     break;
               }
            }
         });
      return ImageOptionsPanel;
   });