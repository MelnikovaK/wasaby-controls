

define('Controls-demo/PageLayout/PageLayoutDemo', [
   'Core/Control',
   'tmpl!Controls-demo/PageLayout/PageLayoutDemo',
   'tmpl!Controls-demo/PageLayout/resources/tabsContent',
   'tmpl!Controls-demo/PageLayout/resources/tabsContent2',
   'tmpl!Controls-demo/PageLayout/resources/controlAreaTemplate',
   'tmpl!Controls-demo/PageLayout/resources/controlAreaTemplate2',
   'WS.Data/Source/Memory'
], function(Control,
            template,
            tabsContent,
            tabsContent2,
            controlAreaTemplate,
            controlAreaTemplate2,
            MemorySource
) {
   'use strict';
   var demoTabsSource = new MemorySource({
         idProperty: 'id',
         data: [
            {
               id: '1',
               title: 'very',
               content: 'tmpl!Controls-demo/PageLayout/resources/tabsContent',
               controlPanelTemplate: 'tmpl!Controls-demo/PageLayout/resources/controlAreaTemplate'
            },
            {
               id: '2',
               title: 'hard',
               content: 'tmpl!Controls-demo/PageLayout/resources/tabsContent2',
               controlPanelTemplate: 'tmpl!Controls-demo/PageLayout/resources/controlAreaTemplate2'
            },
            {
               id: '3',
               title: 'invent',
               content: 'tmpl!Controls-demo/PageLayout/resources/tabsContent',
               controlPanelTemplate: 'tmpl!Controls-demo/PageLayout/resources/controlAreaTemplate'
            },
            {
               id: '4',
               title: 'tabs',
               content: 'tmpl!Controls-demo/PageLayout/resources/tabsContent2',
               controlPanelTemplate: 'tmpl!Controls-demo/PageLayout/resources/controlAreaTemplate2'
            },
            {
               id: '5',
               title: 'titles',
               content: 'tmpl!Controls-demo/PageLayout/resources/tabsContent',
               controlPanelTemplate: 'tmpl!Controls-demo/PageLayout/resources/controlAreaTemplate'
            }
         ]
      });

   var demoBrowserTabs = Control.extend({
      _template: template,
      _demoTabsSelectedKey: '1',
      _demoTabsSource: demoTabsSource
   });
   return demoBrowserTabs;
});
