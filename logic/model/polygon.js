var Geometry = require("./geometry").Geometry,
    Position = require("./position").Position;

/**
 *
 * A Geometry whose coordinates property must be an array of
 * LinearRing coordinate arrays. For Polygons with multiple
 * rings, the first must be the exterior ring and any others
 * must be interior rings or holes.
 *
 * @class
 * @extends external:Geometry
 */
exports.Polygon = Geometry.specialize(/** @lends Polygon.prototype */ {

    /**
     * @type {array<array<Position>>
     */
    coordinates: {
        value: undefined
    },

    coordinatesDidChange: {
        value: function () {
            if (this._rangeChangeCanceler) {
                this._rangeChangeCanceler();
            }
            if (this.coordinates && this.coordinates.length) {
                this._rangeChangeCanceler = this.coordinates[0].addRangeChangeListener(this);
            }
            this._recalculateBbox();
        }
    },

    /**
     * @method
     * @param {Polygon} geometry    - The polygon to test for
     *                                intersection
     * @returns {boolean}
     */
    intersects: {
        value: function (geometry) {
            return this.intersectsBbox(geometry.bbox) && this._intersectsPolygon(geometry);
        }
    },

    bboxPositions: {
        get: function () {
            return this.coordinates && this.coordinates[0];
        }
    },

    /**
     * @method
     * @private
     * @param {Polygon} polygon
     * @return boolean
     */
    _intersectsPolygon: {
        value: function (polygon) {
            var isIntersecting = false,
                outerRing = polygon.coordinates[0],
                i, n;
            for (i = 0, n = outerRing.length; i < n && !isIntersecting; i += 1) {
                isIntersecting = this._containsPosition(outerRing[i]);
            }
            return isIntersecting;
        }
    },

    /**
     * @method
     * @private
     * @param {Position} position
     * @return boolean
     */
    _containsPosition: {
        value: function (position) {
            var coordinates = this.coordinates,
                doesContain = true,
                isInPolygon, i, n;
            for (i = 0, n = coordinates.length; i < n && doesContain; i += 1) {
                isInPolygon = this._isPositionInPolygon(coordinates[i], position);
                doesContain = i === 0 ? isInPolygon : !isInPolygon;
            }
            return doesContain;
        }
    },

    /**
     * @method
     * @private
     * @param {Polygon} polygon
     * @param {Position} position
     * @return boolean
     */
    _isPositionInPolygon: {
        value: function (polygon, position) {
            var x = position.longitude,
                y = position.latitude,
                isPositionInPolygon = false,
                iPosition, jPosition,
                i, j, length,
                x1, y1, x2, y2;

            for (i = 0, j = polygon.length - 1, length = polygon.length; i < length; j = i++) {
                iPosition = polygon[i];
                jPosition = polygon[j];
                x1 = iPosition.longitude;
                y1 = iPosition.latitude;
                x2 = jPosition.longitude;
                y2 = jPosition.latitude;

                if ((y1 < y && y2 >= y || y2 < y && y1 >= y) && (x1 <= x || x2 <= x)) {
                    if (x1 + (y - y1) / (y2 - y1) * (x2 - x1) < x) {
                        isPositionInPolygon = !isPositionInPolygon;
                    }
                }
            }

            return isPositionInPolygon;
        }
    },

    _rangeChangeCanceler: {
        value: undefined
    }

}, {

    /**
     * Returns a newly initialized point with the specified coordinates.
     *
     * @param {array<array<number>>} rings - The LinearRings that compose
     *                                       this polygon.  The first ring
     *                                       is the outline of the polygon.
     *                                       The other rings represent holes
     *                                       inside the outer polygon.
     * @return {Polygon} polygon
     */
    withCoordinates: {
        value: function (rings) {
            var self = new this();
            self.coordinates = rings.map(function (ring) {
                return ring.map(function (coordinates) {
                    return Position.withCoordinates(coordinates);
                });
            });
            return self;
        }
    }

});
