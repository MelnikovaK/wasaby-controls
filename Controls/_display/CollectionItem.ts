import {
   DestroyableMixin,
   OptionsToPropertyMixin,
   InstantiableMixin,
   SerializableMixin,
   IInstantiable,
   IVersionable
} from 'Types/entity';
import Collection, {ISourceCollection} from './Collection';
import {ISerializableState as IDefaultSerializableState} from 'Types/entity';
import {IList} from 'Types/collection';
import {register} from 'Types/di';
import {mixin} from 'Types/util';
import IItemActions from './interface/IItemActions';

export interface IOptions<T> {
   contents: T;
   owner: Collection<T>;
}

export interface ISerializableState<T> extends IDefaultSerializableState {
   $options: IOptions<T>;
   ci: number;
   iid: string;
}

export interface ICollectionItemCounters {
   [key: string]: number;
}

/**
 * Элемент коллекции
 * @class Controls/_display/CollectionItem
 * @mixes Types/_entity/DestroyableMixin
 * @mixes Types/_entity/OptionsMixin
 * @implements Types/_entity/IInstantiable
 * @mixes Types/_entity/InstantiableMixin
 * @mixes Types/_entity/SerializableMixin
 * @public
 * @author Мальцев А.А.
 */
export default class CollectionItem<T> extends mixin<
   DestroyableMixin,
   OptionsToPropertyMixin,
   InstantiableMixin,
   SerializableMixin
>(
   DestroyableMixin,
   OptionsToPropertyMixin,
   InstantiableMixin,
   SerializableMixin
) implements IInstantiable {

   // region IInstantiable

   readonly '[Types/_entity/IInstantiable]': boolean;

   getInstanceId: () => string;

   /**
    * Коллекция, которой принадлежит элемент
    */
   protected _$owner: Collection<T>;

   /**
    * Содержимое элемента коллекции
    */
   protected _$contents: T;

   /**
    * Элемент выбран
    */
   protected _$selected: boolean;

   /**
    * Элемент отмечен маркером
    */
   protected _$marked: boolean;

   /**
    * Элемент находится в режиме редактирования
    */
   protected _$editing: boolean;

   /**
    * Операции над записью
    */
   protected _$actions: IItemActions;

   /**
    * Элемент находится в режиме отображения операций над записью по свайпу
    */
   protected _$swiped: boolean;

   protected _instancePrefix: string;

   /**
    * Индекс содержимого элемента в коллекции (используется для сериализации)
    */
   protected _contentsIndex: number;

   protected _version: number;

   protected _counters: ICollectionItemCounters;

   constructor(options: IOptions<T>) {
      super();
      OptionsToPropertyMixin.call(this, options);
      SerializableMixin.call(this);

      this._counters = {};
   }

   // endregion

   // region Public

   /**
    * Возвращает коллекцию, которой принадлежит элемент
    */
   getOwner(): Collection<T> {
      return this._$owner;
   }

   /**
    * Устанавливает коллекцию, которой принадлежит элемент
    * @param owner Коллекция, которой принадлежит элемент
    */
   setOwner(owner: Collection<T>): void {
      this._$owner = owner;
   }

   /**
    * Возвращает содержимое элемента коллекции
    */
   getContents(): T {
      if (this._contentsIndex !== undefined) {
         // Ленивое восстановление _$contents по _contentsIndex после десериализации
         const collection = this.getOwner().getCollection();
         if (collection['[Types/_collection/IList]']) {
            this._$contents = (collection as any as IList<T>).at(this._contentsIndex);
            this._contentsIndex = undefined;
         }
      }
      return this._$contents;
   }

   /**
    * Устанавливает содержимое элемента коллекции
    * @param contents Новое содержимое
    * @param [silent=false] Не уведомлять владельца об изменении содержимого
    */
   setContents(contents: T, silent?: boolean): void {
      if (this._$contents === contents) {
         return;
      }
      this._$contents = contents;
      if (!silent) {
         this._notifyItemChangeToOwner('contents');
      }
   }

   getVersion(): number {
      const contents = this._$contents as unknown as IVersionable;
      if (contents && typeof contents.getVersion === 'function') {
         return this._version + contents.getVersion();
      }
      return this._version;
   }

   /**
    * Возвращает псевдоуникальный идентификатор элемента коллекции, основанный на значении опции {@link contents}.
    */
   getUid(): string {
      if (!this._$owner) {
         return;
      }
      return this._$owner.getItemUid(this);
   }

   /**
    * Возвращает признак, что элемент выбран
    */
   isSelected(): boolean {
      return this._$selected;
   }

   /**
    * Устанавливает признак, что элемент выбран
    * @param selected Элемент выбран
    * @param [silent=false] Не уведомлять владельца об изменении признака выбранности
    */
   setSelected(selected: boolean, silent?: boolean): void {
      if (this._$selected === selected) {
         return;
      }
      this._$selected = selected;
      if (!silent) {
         this._notifyItemChangeToOwner('selected');
      }
   }

   // endregion

   getMultiSelectClasses(): string {
      let classes = 'controls-ListView__checkbox controls-ListView__notEditable';
      if (this.getOwner().getMultiSelectVisibility() === 'onhover' && !this.isSelected()) {
         classes += ' controls-ListView__checkbox-onhover';
      }
      return classes;
   }

   getDisplayProperty(): string {
      return this.getOwner().getDisplayProperty();
   }

   isMarked(): boolean {
      return this._$marked;
   }

   setMarked(marked: boolean, silent?: boolean): void {
      if (this._$marked === marked) {
         return;
      }
      this._$marked = marked;
      this._nextVersion();
      if (!silent) {
         this._notifyItemChangeToOwner('marked');
      }
   }

   isEditing(): boolean {
      return this._$editing;
   }

   setEditing(editing: boolean, silent?: boolean): void {
      if (this._$editing === editing) {
         return;
      }
      this._$editing = editing;
      this._nextVersion();
      if (!silent) {
         this._notifyItemChangeToOwner('editing');
      }
   }

   isSwiped(): boolean {
      return this._$swiped;
   }

   setSwiped(swiped: boolean, silent?: boolean): void {
      if (this._$swiped === swiped) {
         return;
      }
      this._$swiped = swiped;
      this._nextVersion();
      if (!silent) {
         this._notifyItemChangeToOwner('swiped');
      }
   }

   setActions(actions: IItemActions, silent?: boolean): void {
      if (this._$actions === actions) {
         return;
      }
      this._$actions = actions;
      this._nextVersion();
      if (!silent) {
         this._notifyItemChangeToOwner('actions');
      }
   }

   getActions(): IItemActions {
      return this._$actions;
   }

   hasVisibleActions(): boolean {
      return this._$actions && this._$actions.showed && this._$actions.showed.length > 0;
   }

   hasActionWithIcon(): boolean {
      return this.hasVisibleActions() && this._$actions.showed.some((action) => !!action.icon);
   }

   shouldDisplayActions(): boolean {
      return this.hasVisibleActions() || this.isEditing();
   }

   increaseCounter(name: string): number {
      if (typeof this._counters[name] === 'undefined') {
         this._counters[name] = 0;
      }
      return ++this._counters[name];
   }

   getCounters(): ICollectionItemCounters {
      return this._counters;
   }

   // region SerializableMixin

   _getSerializableState(state: IDefaultSerializableState): ISerializableState<T> {
      const resultState = SerializableMixin.prototype._getSerializableState.call(this, state) as ISerializableState<T>;

      if (resultState.$options.owner) {
         // save element index if collections implements Types/_collection/IList
         const collection = resultState.$options.owner.getCollection();
         const index = collection['[Types/_collection/IList]']
            ? (collection as any as IList<T>).getIndex(resultState.$options.contents)
            : -1;
         if (index > -1) {
            resultState.ci = index;
            delete resultState.$options.contents;
         }
      }

      // By performance reason. It will be restored at Collection::_setSerializableState
      // delete resultState.$options.owner;

      resultState.iid = this.getInstanceId();

      return resultState;
   }

   _setSerializableState(state: ISerializableState<T>): Function {
      const fromSerializableMixin = SerializableMixin.prototype._setSerializableState(state);
      return function(): void {
         fromSerializableMixin.call(this);
         if (state.hasOwnProperty('ci')) {
            this._contentsIndex = state.ci;
         }
         this._instanceId = state.iid;
      };
   }

   // endregion

   // region Protected

   /**
    * Возвращает коллекцию проекции
    * @protected
    */
   protected _getSourceCollection(): ISourceCollection<T> {
      return this.getOwner().getCollection();
   }

   /**
    * Генерирует событие у владельца об изменении свойства элемента
    * @param property Измененное свойство
    * @protected
    */
   protected _notifyItemChangeToOwner(property: string): void {
      if (this._$owner) {
         this._$owner.notifyItemChange(
            this,
            // @ts-ignore fix argument type
            property
         );
      }
   }

   // endregion

   protected _nextVersion(): void {
      this._version++;
   }
}

Object.assign(CollectionItem.prototype, {
   '[Controls/_display/CollectionItem]': true,
   _moduleName: 'Controls/display:CollectionItem',
   _$owner: null,
   _$contents: null,
   _$selected: false,
   _$marked: false,
   _$editing: false,
   _$actions: null,
   _$swiped: false,
   _instancePrefix: 'collection-item-',
   _contentsIndex: undefined,
   _counters: null,
   _version: 0
});

register('Controls/display:CollectionItem', CollectionItem);
