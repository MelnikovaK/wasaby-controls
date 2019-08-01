import {factory as chainFactory} from 'Types/chain';
import {ICrud, Query, DataSet} from 'Types/source';
import {mixin} from 'Types/util';
import {IVersionable, VersionableMixin} from 'Types/entity';
import dateRangeUtil = require('Controls/Utils/DateRangeUtil');
import monthListUtils from './Utils';

export interface IOptions {
   viewMode: string;
   source: ICrud;
}

export default class ExtDataModel extends mixin<VersionableMixin>(VersionableMixin) implements IVersionable {
    readonly '[Types/_entity/VersionableMixin]': true;
    protected _data: object = {};
    protected _viewMode: string;
    protected _source: ICrud;

    constructor(options: IOptions) {
        super(options);
        this._viewMode = options.viewMode;
        this._source = options.source;
    }

    invalidatePeriod(start: Date, end: Date): void {
        const loadedDates = this._getLoadedDatesIds().map((dateId) =>  monthListUtils.idToDate(dateId));
        for (const date of loadedDates) {
            if (date >= start && date <= end) {
                delete this._data[monthListUtils.dateToId(date)];
            }
        }
    }

    enrichItems(dates: number[]): void {
        if (!this._source) {
            return;
        }

        let
            loadedDatesIds: number[] = this._getLoadedDatesIds()
                .map((dateId) =>  monthListUtils.idToDate(dateId).getTime()),
            newDatesIds: number[] = dates.filter((date) => loadedDatesIds.indexOf(date) === -1),
            start: Date,
            end: Date;

        if (newDatesIds.length) {
            start = new Date(Math.min.apply(null, newDatesIds));
            end = new Date(Math.max.apply(null, newDatesIds));
            this._source.query(this._getQuery(start, end)).addCallback(this._updateData.bind(this));
        }
    }

    getData(date: string): object {
        return this._data[date];
    }

    private _getQuery(start: Date, end: Date): Query {
        let
            length: number = dateRangeUtil.getPeriodLengthInMonths(start, end),
            query: Query = new Query();

        if (this._viewMode === 'year') {
            end.setMonth(end.getMonth() + 11);
            length = dateRangeUtil.getPeriodLengthInMonths(start, end);
        }
        start.setMonth(start.getMonth() - 1);

        return query.where({'id>=': monthListUtils.dateToId(start)}).limit(length);
    }

    private _updateData(items: DataSet): void {
        const
            richItems = items.getAll(),
            extData: object = {};

        if (this._viewMode === 'year') {
            chainFactory(richItems).each((item, index) => {
                const year: number = parseInt(item.getId().split("-")[0], 10);
                if (!extData[year]) {
                    extData[year] = [item.get('extData')];
                } else {
                    extData[year].push(item.get('extData'));
                }
            });
            for (const year of Object.keys(extData)) {
                this._data[monthListUtils.dateToId(new Date(parseInt(year, 10), 0))] = extData[year];
            }
        } else {
            chainFactory(richItems).each((item, index) => {
                this._data[item.getId()] = item.get('extData');
            });
        }
        this._nextVersion();
    }

    protected _getLoadedDatesIds(): string[] {
        return Object.keys(this._data);
    }
}
