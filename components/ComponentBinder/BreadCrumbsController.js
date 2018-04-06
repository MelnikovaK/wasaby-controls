define('SBIS3.CONTROLS/ComponentBinder/BreadCrumbsController', ["Core/constants", "Core/Abstract", 'Core/core-clone'], function(constants, cAbstract, coreClone) {

   var BreadCrumbsController = cAbstract.extend({
      $protected: {
         _options: {
            view: null,
            breadCrumbs: null,
            backButton: null,
            backButtonTemplate: null
         },
         _currentRoot: null,
         _pathDSRawData: [],
         _path: []
      },



      bindBreadCrumbs: function(breadCrumbs, backButton){
         var self = this,
            view = this._options.view,
            currentRoot = view.getCurrentRoot(),
            items = view.getItems();

         backButton = backButton || this._options.backButton;
         breadCrumbs = breadCrumbs || this._options.breadCrumbs;

         function createBreadCrumb(data){
            var point = {};
            point[breadCrumbs._options.displayProperty] = data.title;
            point[breadCrumbs._options.idProperty] = data.id;
            point[breadCrumbs._options.colorField] = data.color;
            point.data = data.data;
            return point;
         }

         function setPreviousRoot() {
            var previousRoot = self._path[self._path.length - 1];

            view.setCurrentRoot(previousRoot ? previousRoot[breadCrumbs._options.idProperty] : null);
            view.reload().addCallback(function(){
               if (self._currentRoot !== null) {
                  self._currentRoot = previousRoot;
                  if (self._path.length) self._path.splice(self._path.length - 1);
               }
            });
         }

         function applyRoot(id, hier) {
            //Этот массив могут использовать другие подписанты, а мы его модифицируем
            var hierClone = coreClone(hier);
            //onSetRoot стреляет после того как перешли в режим поиска (так как он стреляет при каждом релоаде),
            //при этом не нужно пересчитывать хлебные крошки
            if (!self._searchMode){
               var lastHierElem = hierClone[hierClone.length - 1],
                  caption;
               //Если пришла иерархия, которая не является продолжением уже установленной заменим ее целиком
               if ((self._currentRoot && hierClone.length && lastHierElem.parent != self._currentRoot.id)){
                  self._currentRoot = hierClone[0];
                  self._path = hierClone.reverse();
               } else {
                  /* Если root не установлен, и переданный id === null, то считаем, что мы в корне */
                  if ( (id === view._options.root) || (!view._options.root && id === null) ){
                     self._currentRoot = null;
                     self._path = [];
                  }
                  for (i = hierClone.length - 1; i >= 0; i--) {
                     var rec = hierClone[i];
                     if (rec){
                        var c = createBreadCrumb(rec);
                        if (self._currentRoot && !Object.isEmpty(self._currentRoot)) {
                           self._path.push(self._currentRoot);
                        } else {

                        }
                        self._currentRoot = c;
                     }
                  }
               }

               for (i = 0; i < self._path.length; i++){
                  if (self._path[i].id == id) {
                     self._path.splice(i, self._path.length - i);
                     break;
                  }
               }
               
               /* Т.к. у крошек может быть свой idProperty и displayProperty, отличный от полей в пути,
                  которые приходят в событии onSetRoot, надо элементы ковертировать, не именяя исходный путь */
               breadCrumbs.setItems(self._path.reduce(function(result, elem) {
                  result.push(createBreadCrumb(elem));
                  return result;
               }, []));

               if (!backButton.isDestroyed()) {
                  if (self._options.backButtonTemplate && self._currentRoot) {
                     caption = self._options.backButtonTemplate(self._currentRoot.data);
                     if (backButton.getEscapeCaptionHtml()) {
                         backButton.setEscapeCaptionHtml(false);
                     }
                  } else {
                     caption = self._currentRoot ? self._currentRoot.title : '';
                  }
                  backButton.setCaption(caption);
               }
            }
         }

         if (currentRoot !== null && currentRoot !== view.getRoot() && items) {
            applyRoot(currentRoot, view.getHierarchy(items.getMetaData().path, currentRoot));
         }

         this.subscribeTo(view, 'onSetRoot', function(event, id, hier){
            applyRoot(id, hier);
         });

         this.subscribeTo(view, 'onKeyPressed', function(event, jqEvent) {
            if(jqEvent.which === constants.key.backspace) {
               setPreviousRoot();
               jqEvent.preventDefault();
            }
         });

         this.subscribeTo(breadCrumbs, 'onItemClick', function(event, id){
            self._currentRoot = this.getItems().getRecordById(id);
            self._currentRoot = self._currentRoot ? self._currentRoot.getRawData() : null;
            if (id === null){
               self._path = [];
            }
            view.setCurrentRoot(id);
            view.reload();
         });

         this.subscribeTo(backButton, 'onActivated', function(){
            setPreviousRoot();
         });
      },

      /**
       * Установить отображение нового пути для хлебных крошек и кнопки назад
       * @param {Array} path новый путь, последний элемент попадает в BackButton, остальные в хлебные крошки
       */
      setPath: function(path){
         this._path = path;
         if (path.length){
            this._currentRoot = this._path.pop();
         } else {
            this._currentRoot = {};
         }
         this._options.breadCrumbs.setItems(this._path || []);
         this._options.backButton.setCaption(this._currentRoot.title || '');
      },

      getCurrentRootRecord: function(){
         return this._currentRoot ? this._currentRoot.data : null;
      }

   });

   return BreadCrumbsController;

});