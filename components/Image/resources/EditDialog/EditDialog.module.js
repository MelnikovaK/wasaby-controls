/**
 * Created by as.avramenko on 02.10.2015.
 */
define('SBIS3.CONTROLS/Image/resources/EditDialog/EditDialog', [
   "Transport/BLObject",
   "Lib/Control/CompoundControl/CompoundControl",
   "tmpl!SBIS3.CONTROLS/Image/resources/EditDialog/EditDialog",
   "SBIS3.CONTROLS/Image/CropPlugin/CropPlugin",
   "SBIS3.CONTROLS/Utils/ImageUtil",
   "Core/helpers/transport-helpers",
   "SBIS3.CONTROLS/Button",
   "i18n!SBIS3.CONTROLS/Image/resources/EditDialog/EditDialog",
   'css!SBIS3.CONTROLS/Image/resources/EditDialog/EditDialog'
], function( BLObject,CompoundControl, dotTplFn, CropPlugin, ImageUtil, transHelpers) {
   /**
    * SBIS3.CONTROLS/Image/resources/EditDialog/EditDialog
    * @class SBIS3.CONTROLS/Image/resources/EditDialog/EditDialog
    * @extends Lib/Control/CompoundControl/CompoundControl
    */
   var EditDialog = CompoundControl.extend(/** @lends SBIS3.CONTROLS/Image/resources/EditDialog/EditDialog.prototype */{
      _dotTplFn: dotTplFn,
      $protected: {
         _options: {
            /**
             * @cfg {Object} Связанный источник данных
             */
            dataSource: undefined,
            /**
             * @cfg {Object} Фильтр данных
             */
            filter: {},
            /**
             * @cfg {Number} Соотношение сторон в выделяемой области
             * @example
             * <pre>
             *     <option name="cropAspectRatio">0.75</option>
             * </pre>
             */
            cropAspectRatio: undefined,
            /**
             * @cfg {Boolean} Режим автоматического маскимального расширения и центрирования области выделения
             * Если установлено в false - выделение будет установлено в соотстветствии с параметром cropSelection
             * @example
             * <pre>
             *     <option name="cropAutoSelectionMode">true</option>
             * </pre>
             */
            cropAutoSelectionMode: true,
            /**
             * @cfg {Array} Координаты начального выделения
             * @example
             * <pre>
             *     <options name="cropSelection" type="array">
             *        <option>50</option>
             *        <option>50</option>
             *        <option>200</option>
             *        <option>200</option>
             *     </options>
             * </pre>
             */
            cropSelection: undefined
         },
         _image: undefined,
         _imageUrl: undefined,
         _cropPlugin: undefined
      },
      $constructor: function() {
         var
            self = this;
         this._publish('onBeginSave', 'onEndSave', 'onOpenError');
         this._image = this._container.find('.controls-EditDialog__image');
         this._image.on('load', function() {
            var
               dimension = ImageUtil.getDimensions(this._image[0]),
               parent = this.getTopParent(),
               wrapperOffset = this._container.find('.controls-EditDialog__image-wrapper').css('left').replace('px','');
            dimension.height += parent._titleBar.height() + wrapperOffset*2;
            parent.show();
            parent.setSize(dimension);
            this._cropPlugin = new CropPlugin(
               {
                  dataSource: this._options.dataSource,
                  cropAspectRatio: this._options.cropAspectRatio,
                  cropAutoSelectionMode: this._options.cropAutoSelectionMode,
                  cropSelection: this._options.cropSelection,
                  image: this._image,
                  handlers: {
                     onBeginSave: function(event, sendObject) {
                        event.setResult(self._notify('onBeginSave', sendObject));
                     },
                     onEndSave: function(event, result) {
                        event.setResult(self._notify('onEndSave', result));
                        self.sendCommand('close');
                     }
                  }
               });
               //в ie8 Jcrop не отрабатывает, тк img.complete=false в данный момент
               setTimeout( function() {
                  this._cropPlugin.startCrop();
               }.bind(this),0);
         }.bind(this));
         this._image.on('error', function(event){
            self._notify('onOpenError', event);
            self.sendCommand('close');
         });
         this._imageUrl = transHelpers.prepareGetRPCInvocationURL(this._options.dataSource.getEndpoint().contract,
            this._options.dataSource.getBinding().read, this._options.filter, BLObject.RETURN_TYPE_ASIS);
         ImageUtil.reloadImage(this._image, this._imageUrl);
      },
      onActivateSaveButton: function() {
         this.getParent()._cropPlugin.makeCrop();
      },
      destroy: function() {
         if (this._cropPlugin) {
            this._cropPlugin.destroy();
         }
         EditDialog.superclass.destroy.apply(this, arguments);
      }
   });
   EditDialog.dimensions = {
      autoWidth: false,
      autoHeight: false,
      resizable: false
   };
   return EditDialog;
});