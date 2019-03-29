define(
   [
      'Controls/Popup/Opener/Stack/StackStrategy',
      'Controls/Popup/Opener/Stack/StackController',
      'Controls/Popup/Opener/Stack',
      'Controls-demo/Popup/TestMaximizedStack',
      'Controls/Popup/Opener/BaseController'
   ],
   (StackStrategy, StackController, StackOpener, TestMaximizedStack, BaseController) => {
      'use strict';

      describe('Controls/Popup/Opener/Stack', () => {
         StackStrategy.getMaxPanelWidth = () => 1000;
         let item = {
            popupOptions: {
               minWidth: 600,
               maxWidth: 800
            }
         };

         it('Opener: getConfig', () => {
            let getStackConfig = StackOpener._private.getStackConfig;
            let config = getStackConfig();
            assert.equal(config.isDefaultOpener, true);

            config = getStackConfig({ isDefaultOpener: false });
            assert.equal(config.isDefaultOpener, false);
         });

         it('stack with config sizes', () => {
            var position = StackStrategy.getPosition({ top: 0, right: 0 }, item);
            assert.isTrue(position.width === item.popupOptions.maxWidth);
            assert.isTrue(position.top === 0);
            assert.isTrue(position.right === 0);
            assert.isTrue(position.bottom === 0);
         });

         it('stack shadow', () => {
            let baseGetItemPosition = StackController._private.getItemPosition;
            StackController._private.getItemPosition = items => (items.position);
            StackController._stack.add({ containerWidth: 840, popupOptions: { className: '' } });
            StackController._stack.add({ position: { width: 720 }, popupOptions: { className: '' } });
            StackController._stack.add({ containerWidth: 600, popupOptions: { className: '' } });
            StackController._stack.add({ position: { width: 600 }, popupOptions: { className: '' } });
            StackController._stack.add({ position: { width: 1000 }, popupOptions: { className: '' } });
            StackController._stack.add({ position: { width: 840 }, popupOptions: { className: '' } });
            StackController._stack.add({ containerWidth: 600, popupOptions: { className: '' } });
            StackController._stack.add({ containerWidth: 720, popupOptions: { className: '' } });
            StackController._stack.add({ containerWidth: 200, popupState: 'destroying', popupOptions: { className: '' } });
            StackController._stack.add({ containerWidth: 200, popupOptions: { className: '' } });
            StackController._update();
            StackController._update();
            StackController._update();
            assert.isTrue(StackController._stack.at(0).popupOptions.className.indexOf('controls-Stack__shadow') >= 0);
            assert.isTrue(StackController._stack.at(1).popupOptions.className.indexOf('controls-Stack__shadow') >= 0);
            assert.isTrue(StackController._stack.at(2).popupOptions.className.indexOf('controls-Stack__shadow') >= 0);
            assert.isTrue(StackController._stack.at(3).popupOptions.className.indexOf('controls-Stack__shadow') < 0);
            assert.isTrue(StackController._stack.at(4).popupOptions.className.indexOf('controls-Stack__shadow') >= 0);
            assert.isTrue(StackController._stack.at(5).popupOptions.className.indexOf('controls-Stack__shadow') >= 0);
            assert.isTrue(StackController._stack.at(6).popupOptions.className.indexOf('controls-Stack__shadow') >= 0);
            assert.isTrue(StackController._stack.at(7).popupOptions.className.indexOf('controls-Stack__shadow') >= 0);
            assert.isTrue(StackController._stack.at(8).popupOptions.className.indexOf('controls-Stack__shadow') < 0);
            assert.isTrue(StackController._stack.at(9).popupOptions.className.indexOf('controls-Stack__shadow') >= 0);

            StackController._private.getItemPosition = baseGetItemPosition;
         });


         it('stack default position', () => {
            StackController._private.getWindowSize = () => ({ width: 1920, height: 950 }); // Этот метод зовет получение размеров окна, для этих тестов не нужно
            StackController._private.getStackParentCoords = () => ({ top: 0, right: 0 }); // Этот метод зовет получение размеров окна, для этих тестов не нужно
            let itemConfig = {
               popupOptions: item.popupOptions
            };
            itemConfig.popupOptions.template = TestMaximizedStack;
            itemConfig.popupOptions.minimizedWidth = undefined;
            StackController.getDefaultConfig(itemConfig);
            assert.equal(itemConfig.position.top, 0);
            assert.equal(itemConfig.position.right, 0);
            assert.equal(itemConfig.position.width, 800);
            assert.equal(itemConfig.position.bottom, 0);
            assert.equal(itemConfig.popupOptions.content, 'wml!Controls/Popup/Opener/Stack/StackContent');
         });

         it('stack maximized popup position', () => {
            let item = {
               popupOptions: {
                  minWidth: 600,
                  maxWidth: 800
               },
               hasMaximizePopup: true
            };
            let position = StackStrategy.getPosition({ top: 0, right: 100 }, item);
            assert.equal(position.right, 0);
         });

         it('stack maximized default options', () => {
            let itemConfig = {
               popupOptions: {
                  templateOptions: {},
                  template: TestMaximizedStack
               }
            };
            StackController.getDefaultConfig(itemConfig);
            assert.equal(itemConfig.popupOptions.minWidth, 800);
            assert.equal(itemConfig.popupOptions.maxWidth, 1200);
            assert.equal(itemConfig.popupOptions.minimizedWidth, 500);

            itemConfig = {
               popupOptions: {
                  minWidth: 850,
                  maxWidth: 1250,
                  minimizedWidth: 550,
                  templateOptions: {},
                  template: TestMaximizedStack
               }
            };
            StackController.getDefaultConfig(itemConfig);
            assert.equal(itemConfig.popupOptions.minWidth, 850);
            assert.equal(itemConfig.popupOptions.maxWidth, 1250);
            assert.equal(itemConfig.popupOptions.minimizedWidth, 550);
         });

         it('stack panel maximized', () => {
            StackController._update = () => {}; // Этот метод зовет получение размеров окна, для этих тестов не нужно
            StackController._private.prepareSizes = () => {}; // Этот метод зовет получение размеров окна, для этих тестов не нужно
            StackController._private.getWindowSize = () => ({ width: 1920, height: 950 }); // Этот метод зовет получение размеров окна, для этих тестов не нужно

            let popupOptions = {
               minimizedWidth: 600,
               minWidth: 900,
               maxWidth: 1200,
               templateOptions: {}
            };
            let itemConfig = {
               popupOptions: popupOptions
            };

            StackStrategy.getMaxPanelWidth = () => 1600;

            assert.equal(StackStrategy.isMaximizedPanel(itemConfig), true);

            itemConfig.popupOptions.template = TestMaximizedStack;
            StackController.getDefaultConfig(itemConfig);
            assert.equal(itemConfig.popupOptions.maximized, false); // default value
            assert.equal(itemConfig.popupOptions.templateOptions.hasOwnProperty('showMaximizedButton'), true);

            StackController.elementMaximized(itemConfig, {}, false);
            assert.equal(itemConfig.popupOptions.maximized, false);
            assert.equal(itemConfig.popupOptions.templateOptions.maximized, false);
            let position = StackStrategy.getPosition({ top: 0, right: 0 }, itemConfig);
            assert.equal(position.width, popupOptions.minimizedWidth);

            StackController.elementMaximized(itemConfig, {}, true);
            assert.equal(itemConfig.popupOptions.maximized, true);
            assert.equal(itemConfig.popupOptions.templateOptions.maximized, true);
            position = StackStrategy.getPosition({ top: 0, right: 0 }, itemConfig);
            assert.equal(position.width, popupOptions.maxWidth);

            StackController._private.prepareMaximizedState(1600, itemConfig);
            assert.equal(itemConfig.popupOptions.templateOptions.showMaximizedButton, true);

            StackController._private.prepareMaximizedState(800, itemConfig);
            assert.equal(itemConfig.popupOptions.templateOptions.showMaximizedButton, false);
         });

         it('stack state', () => {
            let itemConfig = {
               id: '22',
               popupOptions: item.popupOptions
            };
            StackController._update = () => {}; // Этот метод зовет получение размеров окна, для этих тестов не нужно
            StackController._private.prepareSizes = () => {}; // Этот метод зовет получение размеров окна, для этих тестов не нужно
            StackController._private.getWindowSize = () => ({ width: 1920, height: 950 }); // Этот метод зовет получение размеров окна, для этих тестов не нужно

            StackController._elementCreated(itemConfig, {});

            // Зависит от того где запускаем тесты, под нодой или в браузере
            assert.isTrue(itemConfig.popupState === BaseController.POPUP_STATE_CREATED || itemConfig.popupState === BaseController.POPUP_STATE_CREATING);

            StackController.elementAnimated(itemConfig);
            assert.equal(itemConfig.popupState, BaseController.POPUP_STATE_CREATED);

            itemConfig.popupOptions.className = '';
            StackController._elementUpdated(itemConfig, {});
            StackController._elementUpdated(itemConfig, {});
            StackController._elementUpdated(itemConfig, {});

            // класс обновился, потому что состояние было opened. После множ. update класс не задублировался
            assert.equal(itemConfig.popupState, BaseController.POPUP_STATE_UPDATING);
            assert.equal(itemConfig.popupOptions.className, ' controls-Stack');

            StackController._elementAfterUpdated(itemConfig, {});
            assert.equal(itemConfig.popupState, BaseController.POPUP_STATE_UPDATED);

            itemConfig.popupState = 'notOpened';
            itemConfig.popupOptions.className = '';
            StackController._elementUpdated(itemConfig, {});

            // класс не обновился, потому что состояние не opened
            assert.equal(itemConfig.popupOptions.className, '');

            StackController._elementDestroyed(itemConfig, {});

            // Зависит от того где запускаем тесты, под нодой или в браузере
            assert.isTrue(itemConfig.popupState === BaseController.POPUP_STATE_DESTROYING || itemConfig.popupState === BaseController.POPUP_STATE_DESTROYED);

            itemConfig._destroyDeferred.addCallback(function() {
               assert.equal(itemConfig.popupState, BaseController.POPUP_STATE_DESTROYED);
            });
            StackController.elementAnimated(itemConfig, {});
         });

         it('stack from target container', () => {
            var position = StackStrategy.getPosition({ top: 100, right: 100 }, item);
            assert.equal(position.width, item.popupOptions.maxWidth);
            assert.isTrue(position.top === 100);
            assert.isTrue(position.right === 100);
            assert.isTrue(position.bottom === 0);
         });
         it('stack without config sizes', () => {
            StackStrategy.getMaxPanelWidth = () => 1000;
            let item = {
               popupOptions: {},
               containerWidth: 800
            };
            var position = StackStrategy.getPosition({ top: 0, right: 0 }, item);
            assert.equal(position.width, undefined);
            assert.isTrue(position.top === 0);
            assert.isTrue(position.right === 0);
            assert.isTrue(position.bottom === 0);

            item.containerWidth = 1200;
            position = StackStrategy.getPosition({ top: 0, right: 0 }, item);
            assert.equal(position.width, StackStrategy.getMaxPanelWidth());
         });

         it('stack with wrong options type', () => {
            let item = {
               popupOptions: {
                  minWidth: '600',
                  maxWidth: '800'
               }
            };
            var position = StackStrategy.getPosition({ top: 0, right: 0 }, item);
            assert.equal(position.width, parseInt(item.popupOptions.maxWidth, 10));
         });

         it('stack reduced width', () => {
            StackStrategy.getMaxPanelWidth = () => 1000;
            let item = {
               popupOptions: {
                  minWidth: 600,
                  maxWidth: 1800
               }
            };
            var position = StackStrategy.getPosition({ top: 0, right: 0 }, item);
            assert.isTrue(position.width === StackStrategy.getMaxPanelWidth());
            assert.isTrue(position.top === 0);
            assert.isTrue(position.right === 0);
            assert.isTrue(position.bottom === 0);
         });

         it('stack reset offset', () => {
            let item = {
               popupOptions: {
                  minWidth: 800,
                  maxWidth: 1800
               }
            };
            var position = StackStrategy.getPosition({ top: 0, right: 400 }, item);
            assert.equal(position.width, item.popupOptions.minWidth);
            assert.isTrue(position.top === 0);
            assert.isTrue(position.right === 0);
            assert.isTrue(position.bottom === 0);
         });

         it('stack compatible popup', () => {
            let item = {
               popupOptions: {
                  template: {},
                  minWidth: 800,
                  maxWidth: 900,
                  isCompoundTemplate: true
               }
            };
            StackController.getDefaultConfig(item);
            assert.equal(item.position.top, -10000);
            assert.equal(item.position.left, -10000);

            let targetPos = {
               top: 0,
               right: 0
            };

            StackController._private.getStackParentCoords = () => targetPos;

            StackController.elementCreated(item);
            assert.equal(item.position.width, 900);
         });
      });
   }
);
