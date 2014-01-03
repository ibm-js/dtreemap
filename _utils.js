define(function () {
	var utils = {
		group: function (/*Array*/items, /*Array*/groupingFunctions, /*Function*/measureFunction) {
			var response = {
				children: []
			};
			var merge = function (obj, entry) {
				if (!obj.__treeValue) {
					obj.__treeValue = 0;
				}
				obj.__treeValue += measureFunction(entry);
				return obj;
			};
			// we go over each entry in the array
			items.forEach(function (entry) {
				var r = response;
				// for this entry, for each rowField we
				// look at the actual value for this rowField
				// and create a holding object for this
				// value in response if it does not exist
				groupingFunctions.forEach(function (groupingFunction, j) {
					// actual value for the rowField
					var data = groupingFunction(entry);
					// create child if undefined
					var child = utils.find(r.children, function (item) {
						return (item.__treeName === data);
					});
					if (!child) {
						r.children.push(child = {
							__treeName: data,
							__treeID: data + Math.random(),
							children: []
						});
					}
					child = merge(child, entry);
					if (j !== groupingFunctions.length - 1) {
						// branch & prepare response for 
						// next call
						r = child;
					} else {
						// add the entry to the leaf!
						child.children.push(entry);
					}
				});
				r = merge(r, entry);
			});
			return response;
		},
		find: function (/*Array*/array, /*Function*/callback) {
			var l = array.length;
			for (var i = 0; i < l; ++i) {
				if (callback.call(null, array[i])) {
					return array[i];
				}
			}
			return null;
		},
		solve: function (items, width, height, areaFunc, rtl) {
			//
			// Create temporary TreeMap elements
			//
			var treeMapElements = utils.initElements(items, areaFunc);
			var dataTotal = treeMapElements.total;
			var elements = treeMapElements.elements;

			var realSize = dataTotal;

			if (dataTotal === 0) {
				if (elements.length === 0) {
					return {
						items: items,
						rects: [],
						total: 0
					};
				}
				elements.forEach(function (element) {
					element.size = element.sizeTmp = 100;
				});
				dataTotal = elements.length * 100;
			}

			//
			// 	Sort the TreeMap elements
			//
			elements.sort(function (b, a) {
				return a.size - b.size;
			});

			utils._compute(width, height, elements, dataTotal);

			//
			// Restore initial Sort order
			// 
			elements.sort(function (a, b) {
				return a.index - b.index;
			});

			var result = {};
			result.elements = elements;
			result.size = realSize;
			result.rectangles = elements.map(function (element) {
				return {
					x: rtl ? width - element.x - element.width : element.x,
					y: element.y,
					w: element.width,
					h: element.height
				};
			});

			return result;
		},
		initElements: function (items, areaFunc) {
			var total = 0;
			var elements = items.map(function (item, index) {
				var size = areaFunc != null ? areaFunc(item) : 0;
				if (size < 0) {
					throw new Error("item size dimension must be positive");
				}
				total += size;
				return {
					index: index,
					size: size,
					sizeTmp: size
				};
			});
			return {
				elements: elements,
				total: total
			};
		},
		_compute: function (width, height, elements, total) {
			var valueScale = ((width * height) / total) / 100;

			elements.forEach(function (element) {
				element.sizeTmp *= valueScale;
			});

			var start = 0;
			var end = 0;
			var aspectCurr = -1 >>> 1; // int.MaxValue;
			var aspectLast;
			var offsetX = 0;
			var offsetY = 0;
			var tmpWidth = width;
			var tmpHeight = height;

			var vert = tmpWidth > tmpHeight, n;

			while (end !== elements.length) {
				aspectLast = utils._trySolution(elements, start, end, vert, tmpWidth, tmpHeight);

				if ((aspectLast > aspectCurr) || (aspectLast < 1)) {
					var currX = 0;
					var currY = 0;

					for (n = start; n < end; n++) {
						elements[n].x = offsetX + currX;
						elements[n].y = offsetY + currY;
						if (vert) {
							currY += elements[n].height;
						} else {
							currX += elements[n].width;
						}
					}

					if (vert) {
						offsetX += elements[start].width;
					} else {
						offsetY += elements[start].height;
					}

					tmpWidth = width - offsetX;
					tmpHeight = height - offsetY;

					vert = tmpWidth > tmpHeight;

					start = end;
					end = start;

					aspectCurr = -1 >>> 1; // int.MaxValue;
					continue;
				} else {
					for (n = start; n <= end; n++) {
						elements[n].width = elements[n].widthTmp;
						elements[n].height = elements[n].heightTmp;
					}
					aspectCurr = aspectLast;
				}
				end++;
			}

			var currX1 = 0;
			var currY1 = 0;

			for (n = start; n < end; n++) {
				elements[n].x = offsetX + currX1;
				elements[n].y = offsetY + currY1;
				if (vert) {
					currY1 += elements[n].height;
				} else {
					currX1 += elements[n].width;
				}
			}

		},
		_trySolution: function (elements, start, end, vert, tmpWidth, tmpHeight) {
			var total = 0;
			var aspect;
			var localWidth = 0;
			var localHeight = 0;
			var n;

			for (n = start; n <= end; n++) {
				total += elements[n].sizeTmp;
			}

			if (vert) {
				if (tmpHeight === 0) {
					localWidth = localHeight = 0;
				} else {
					localWidth = total / tmpHeight * 100;
					localHeight = tmpHeight;
				}
			} else {
				if (tmpWidth === 0) {
					localWidth = localHeight = 0;
				} else {
					localHeight = total / tmpWidth * 100;
					localWidth = tmpWidth;
				}
			}

			for (n = start; n <= end; n++) {
				if (vert) {
					elements[n].widthTmp = localWidth;
					if (total === 0) {
						elements[n].heightTmp = 0;
					} else {
						elements[n].heightTmp = localHeight * elements[n].sizeTmp / total;
					}
				} else {
					if (total === 0) {
						elements[n].widthTmp = 0;
					} else {
						elements[n].widthTmp = localWidth * elements[n].sizeTmp / total;
					}
					elements[n].heightTmp = localHeight;
				}
			}
			aspect = Math.max(elements[end].heightTmp / elements[end].widthTmp, elements[end].widthTmp
				/ elements[end].heightTmp);
			if (aspect === undefined) {
				return 1;
			}
			return aspect;
		}
	};
	return utils;
});
