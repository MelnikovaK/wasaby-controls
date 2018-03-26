/// <amd-module name="File/Attach" />
// dependency for types
import Deferred = require("Core/Deferred");
import EventObject = require("Core/EventObject");
import Model = require("WS.Data/Entity/Model");
import SourceOption = require("File/Attach/Option/Source");
import ResourceGetterOption = require("File/Attach/Option/ResourceGetter");
import {IFileDataConstructor} from "File/IFileDataConstructor";
import {IFileData} from "File/IFileData";
// real dependency
import Lazy = require("File/Attach/Lazy");
import CoreExtend = require('Core/core-simpleExtend');
import Abstract = require("Core/Abstract");

type Options = {
    sourceOptions: Array<SourceOption>;
    getterOptions: Array<ResourceGetterOption>;
    attachOptions: {
        fileProperty: string;
        multiSelect: boolean;
    }
    [propName: string]: any;
}
/**
 * Класс, реализующий выбор и загрузку файлов через разные источники данных, агрегирующий работу с Attach/Base
 * <pre>
 *   var sourceOptions = {
 *      endpoint: {
 *          contract: "simple"
 *      },
 *      binding: {
 *          create: "ЗагрузитьВНикуда"
 *      }
 *   }
 *   var attach = new Attach({
 *       // Возможные способы загрузки
 *       sourceOptions: [ // загрузка на бизнеслогику
 *          // для загрузки через ajax
 *          new BLXHR(sourceOptions), // модуль опций: SBIS3.File/Attach/Option/Sources/BLXHR
 *          // для загрузки через СБИС Плагин
 *          new BLPlugin(sourceOptions) // модуль опций: SBIS3.File/Attach/Option/Sources/BLPlugin
 *       ],
 *       //  Или фабрика опций для ISource: SBIS3.File/Attach/Option/Sources/Fabric
 *       // sourceOptions: Fabric.getBLSourceOptions(sourceOptions),
 *
 *       // Возможные способы получения ресурсов
 *       getterOptions: [
 *          // Для нативного окна выбора файлов
 *          new FS({
 *              multiSelect: true,
 *              extensions: ["image"]
 *           }), // модуль опций: File/Attach/Option/Getters/FS
 *          // Для выбора чрезе FileLoader/Chooser
 *          new FileChooser({
 *              multiSelect: true,
 *              extensions: ["image"]
 *          }), // модуль опций: SBIS3.File/Attach/Option/Getters/FileChooser
 *          // Для получения файлов, путём Drag&drop
 *          new DropArea({
 *              extensions: ["image"],
 *              ondrop: function(fileData) {
 *                  log(fileData)
 *              },
 *              element: document.querySelector('#toDrop')
 *          }), // модуль опций: File/Attach/Option/Getters/DropArea
 *          // Для работы со сканерами
 *          new Scanner(), // модуль опций: SBIS3.File/Attach/Option/Getters/Scanner
 *          // Для получения фото с веб-камеры
 *          new PhotoCam(), // модуль опций: File/Attach/Option/Getters/PhotoCam
 *          // Для получения ресурсов из буфера обмена
 *          new Clipboard(), // модуль опций: SBIS3.File/Attach/Option/Getters/Clipboard
 *          // Для выбора файлов через окно СБИС Плагин'a
 *          new Dialogs() // модуль опций: SBIS3.File/Attach/Option/Getters/Dialogs
 *      ],
 *      // Конфигурация {@link File/Attach/Base}
 *      attachOptions: {
 *          fileProperty: "Файл",
 *          multiSelect: true
 *      }
 *   });
 *
 *   self.getChildControlByName("fsBtn").subscribe("onActivated", function(){
 *      attach.choose("FS");
 *   });
 *   self.getChildControlByName("clipboardBtn").subscribe("onActivated", function(){
 *      attach.choose("ClipboardGetter");
 *   });
 *   self.getChildControlByName("scanBtn").subscribe("onActivated", function(){
 *      attach.choose("ScannerGetter");
 *   });
 *   self.getChildControlByName("uploadBtn").subscribe("onActivated", function(){
 *      attach.upload({
 *          // Дополнительные мета-данные для отправки
 *          // Сигнатура зависит от конечного сервиса загрузки
 *      });
 *   });
 * </pre>
 * @public
 * @class
 * @name File/Attach
 * @extends Core/Abstract
 * @author Заляев А.В.
 */
let Attach  = CoreExtend.extend(Abstract,{
    _$options: {
        /**
         * @cfg {Object} Объект конфигурирования {@link File/Attach/Base}
         * @example
         * <pre>
         *   var attach = new Attach({
         *      attachOptions: {
         *          multiSelect: true
         *      }
         *      ...
         *   });
         * </pre>
         * @see File/Attach/Base
         */
        attachOptions: {
            fileProperty: "Файл"
        },
        /**
         * @cfg {Array<File/Attach/Option/Source>} Набор параметров для регестрации ISource
         * @example
         * Загрузка на бизнеслогику
         * <pre>
         *   var attach = new Attach({
         *       // фабрика опций для ISource: {@link SBIS3.File/Attach/Option/Sources/Fabric}
         *       sourceOptions: Fabric.getBLSourceOptions({
         *          endpoint: {
         *              contract: "simple"
         *          },
         *          binding: {
         *              create: "ЗагрузитьВНикуда"
         *          },
         *       }),
         *       ...
         *   });
         * </pre>
         * Загрузка в СБИС Диск
         * <pre>
         *   var attach = new Attach({
         *       // фабрика опций для ISource: {@link SBIS3.File/Attach/Option/Sources/Fabric}
         *       sourceOptions: Fabric.getSbisDiskSourceOptions({
         *          catalog: 'mydocs'
         *       }),
         *       ...
         *   });
         * </pre>
         * @see File/Attach/Option/Source
         */
        sourceOptions: [],
        /**
         * @cfg {Array<File/Attach/Option/ResourceGetter>} Набор параметров для регестрации
         * {@link File/IResourceGetter}, указывающий доступные способы получения ресурслв
         * @example
         * <pre>
         *   var attach = new Attach({
         *       getterOptions: [
         *          // Для нативного окна выбора файлов
         *          new FS({
         *              multiSelect: true,
         *              extensions: ["image"]
         *           }), // модуль опций: File/Attach/Option/Getters/FS
         *          // Для выбора чрезе FileLoader/Chooser
         *          new FileChooser({
         *              multiSelect: true,
         *              extensions: ["image"]
         *          }), // модуль опций: SBIS3.File/Attach/Option/Getters/FileChooser
         *          // Для получения файлов, путём Drag&drop
         *          new DropArea({
         *              extensions: ["image"],
         *              ondrop: function(fileData) {
         *                  log(fileData)
         *              },
         *              element: document.querySelector('#toDrop')
         *          }), // модуль опций: File/Attach/Option/Getters/DropArea
         *          // Для работы со сканерами
         *          new Scanner(), // модуль опций: SBIS3.File/Attach/Option/Getters/Scanner
         *          // Для получения фото с веб-камеры
         *          new PhotoCam(), // модуль опций: File/Attach/Option/Getters/PhotoCam
         *          // Для получения ресурсов из буфера обмена
         *          new Clipboard(), // модуль опций: SBIS3.File/Attach/Option/Getters/Clipboard
         *          // Для выбора файлов через окно СБИС Плагин'a
         *          new Dialogs() // модуль опций: SBIS3.File/Attach/Option/Getters/Dialogs
         *      ],
         *      ...
         *   });
         * </pre>
         * @see File/Attach/Option/ResourceGetter
         * @see File/IResourceGetter
         */
        getterOptions: []
    },
    constructor(opt: Options) {
        Attach.superclass.constructor.apply(this, arguments);
        this._$options = Object.assign({}, this._$options, opt);
        this._attacher = new Lazy(this._$options.attachOptions);
        let events = [
            "onProgress", "onWarning", "onLoadedFolder", "onLoaded", "onChooseError", "onChoose",
            "onLoadError", "onLoadResourceError", "onLoadedResource"
        ];
        this._publish.apply(this, events);
        // пробрасываем события загрузки файлов
        events.forEach((eventName: string) => {
            this._attacher.subscribe(eventName, (event: EventObject, ...args) => {
                event.setResult(this._notify(eventName, ...args));
            });
        });
        // регестрируем список IResourceGetter из наследников
        opt.getterOptions.forEach((getterOpt) => {
            let getter = getterOpt.getGetter();
            if (typeof getter === "string") {
                return this._attacher.registerLazyGetter(
                    getterOpt.getName(),
                    getter,
                    getterOpt.getOptions()
                );
            }
            this._attacher.registerGetter(getter);
        });
        opt.sourceOptions.forEach((srcOpt) => {
            this._attacher.registerLazySource(
                srcOpt.getResourceType(),
                srcOpt.getSourceName(),
                srcOpt.getOptions()
            )
        });
    },

    /// region IDirectInsertFile
    /**
     * Устанавливает ресурсы в список выбранных
     * @param {Array<File/IFileData> | File/IFileData} files файл или набор устанавливаемых файлов
     * @example
     * Привязка файлов, полученных путём Drag&Drop к Attach для последующей загрузки
     * <pre>
     *    myArea.subscribe("onDrop", function(event, data) {
     *      if (data.file instanceof Blob) {
     *          attach.setSelectedResource(new LocalFile(data.file))
     *      }
     *    });
     * </pre>
     * @method
     * @name File/Attach#setSelectedResource
     * @see File/LocalFile
     * @see File/LocalFileLink
     * @see File/HttpFileLink
     */
    setSelectedResource(files: IFileData | Array<IFileData>): void {
        return this._attacher.setSelectedResource(files);
    },
    /**
     * Очищает набор выбраных ресурсов
     * @void
     * @method
     * @name File/Attach#clearSelectedResource
     */
    clearSelectedResource(): void {
        return this._attacher.clearSelectedResource();
    },
    /**
     * Возвращает набор выбраных ресурсов
     * @return {Array<File/IFileData>}
     * @method
     * @name File/Attach#getSelectedResource
     * @see File/LocalFile
     * @see File/LocalFileLink
     * @see File/HttpFileLink
     */
    getSelectedResource(): Array<IFileData> {
        return this._attacher.getSelectedResource();
    },
    /// endregion

    /// region IUpload
    /**
     * Загрузка выбраных ресурсов.
     * При отсутствии ресурсов во внутреннем состоянии, возвращаеммый Deferred будет завершен ошибкой.
     * @param {*} [meta] Дополнительные мета-данные для отправки. Сигнатура зависит от конечного сервиса загрузки
     * @return {Core/Deferred<Array<WS.Data/Entity/Model | Error>>} Набор, содержащий модели с результатами,
     * либо ошибками загрузки
     * @example
     * Выбор и загрузка файла:
     * <pre>
     *   var attach = new Attach({...});
     *
     *   self.getChildControlByName("fsBtn").subscribe("onActivated", function(){});
     *      attach.choose("FS").addCallback(function(files) {
     *          attach.upload({
     *              // Дополнительные мета-данные для отправки
     *              // Сигнатура зависит от конечного сервиса загрузки
     *              'ИдО': self.getContext().getValue('ИдО')
     *          }).addCallback(function(results){
     *              // вывод результатов загрузки
     *              var successUploads = results.filter(function(res) {
     *                  if (res instanceof Error) {
     *                      alert(res);
     *                      return false;
     *                  }
     *                  return true;
     *              });
     *              self.draw(successUploads);
     *          });;
     *      });
     *   }
     * </pre>
     * @method
     * @name File/Attach#upload
     * @see WS.Data/Entity/Model
     * @see File/Attach/Base#getSelectedResource
     */
    upload(meta?: Object): Deferred<Array<Model | Error>> {
        return this._attacher.upload(meta);
    },
    /// endregion IUpload

    /**
     * Метод вызова выбора ресурсов
     * @param {String} getterName Имя модуля {@link File/IResourceGetter}
     * @return {Core/Deferred<Array<File/IFileData>>}
     * @example
     * Выбор и загрузка файла:
     * <pre>
     *   var attach = new Attach({...});
     *
     *   self.getChildControlByName("fsBtn").subscribe("onActivated", function(){});
     *      attach.choose("FS").addCallback(function(files) {
     *          attach.upload({
     *              // Дополнительные мета-данные для отправки
     *          }).addCallback(function(results){
     *              // вывод результатов загрузки
     *          });;
     *      });
     *   }
     * </pre>
     * @method
     * @name File/Attach#choose
     * @see File/IResourceGetter#getType
     * @see File/LocalFile
     * @see File/LocalFileLink
     * @see File/HttpFileLink
     */
    choose(getterName: string): Deferred<Array<IFileData>> {
        return this._attacher.choose(getterName);
    },
    /**
     * Возвращает список конструкторов над ресурсами, для которыйх зарегестрирован ISource
     * @return {Array<Function>}
     * @see File/LocalFile
     * @see File/LocalFileLink
     * @see File/HttpFileLink
     */
    getRegisteredResource(): Array<IFileDataConstructor> {
        return this._attacher.getRegisteredResource();
    },
    destroy() {
        this._attacher.destroy();
        this._attacher = null;
        Attach.superclass.destroy.apply(this, arguments);
    }
});

export = Attach;

/**
 * @event onProgress
 * @name File/Attach#onProgress
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @param {Object} data
 * @param {File/IFileData} file
 */
/**
 * @event onWarning
 * @name File/Attach#onWarning
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @param {Object} data
 * @param {File/IFileData} file
 */
/**
 * @event onLoadedFolder
 * @name File/Attach#onLoadedFolder
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @param {Object} data
 * @param {File/IFileData} file
 */
/**
 * @event onLoaded
 * Событые окончания загрузки ресурсов
 *
 * @name File/Attach#onLoaded
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @param {Array<Error | WS.Data/Entity/Model>} results Массив, содержащий результаты загрузки выбранных ресурсов.
 * Эквивалентно рузультату Deferred'а .upload
 *
 * @see WS.Data/Entity/Model
 */
/**
 * @event onLoadError
 * Событые ошибки начала загрузки.
 *
 * @name File/Attach#onLoadError
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @param {Error} error
 */
/**
 * @event onLoadResourceError
 * Событые ошибки загрузки отдельного ресурса
 *
 * @name File/Attach#onLoadResourceError
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @param {File/IFileData} resource загружаемый ресурс
 * @param {Error} error
 *
 * @see File/LocalFile
 * @see File/LocalFileLink
 * @see File/HttpFileLink
 */
/**
 * @event onLoadedResource
 * Событые загрузки отдельного ресурса
 *
 * @name File/Attach#onLoadedResource
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @param {File/IFileData} resource загружаемый ресурс
 * @param {Model} model Результат загрузки
 *
 * @see File/LocalFile
 * @see File/LocalFileLink
 * @see File/HttpFileLink
 * @see WS.Data/Entity/Model
 */
/**
 * @event onChoose
 * Событые выбора ресурса
 * <wiTag group="Управление">
 * Обработка результата:
 * При передаче в результат события заначений, приводимых к логическому false, указанный ресурс не попадёт
 * в результат Deferred'a метода choose. При передаче любого другого значения текщуий ресурс будет заменён им
 *
 * @name File/Attach#onChoose
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @param {File/IFileData} resource загружаемый ресурс
 * @example
 * Фильтрация файлов по размеру
 * <pre>
 *    attach.subscribe('onChoose', function(event, fileData) {
 *       if (getSize(fileData) > 100 * MB) {
 *          event.setResult(new Error(rk('Превышен допустимый размер загружаемого файла')))
 *       }
 *    });
 * </pre>
 * Предобработка перед загрузкой
 * <pre>
 *    attach.subscribe('onChoose', function(event, fileData) {
 *       var blurImage = addFilter(fileData, "blur", 0.5);
 *       event.setResult(blurImage);
 *    });
 * </pre>
 *
 * @see File/LocalFile
 * @see File/LocalFileLink
 * @see File/HttpFileLink
 */
/**
 * @event onChooseError
 * Событые ошибки выбора ресурса
 *
 * @name File/Attach#onChooseError
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @param {Error} error объект ошибки
 * @example
 * <pre>
 *    attach.subscribe('onChooseError', function(event, error) {
 *        alert(error);
 *    });
 * </pre>
 */
