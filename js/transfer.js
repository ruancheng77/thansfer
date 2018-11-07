(function (root, factory) {
	"use strict";

	if (typeof define === "function" && defined.amd) {
		define(["jquery"], factory);
	} else if (typeof exports === "object") {
		module.exports = factory(require("jquery"));
	} else {
		root.Transfer = factory(root.jQuery);
	}
})(this, function init($, undefined) {

	"use strict";

	var templates = {
		container: '<div class="transfer">' +
			'<div class="transfer-body">' +
			'	<div class="transfer-body-left">' +
			'	    <div class="transfer-header">' +
			'	        <div class="transfer-title"></div>' +
			'	    </div>' +
			'	    <div class="transfer-container">' +
			'	        <table class="transfer-table transfer-table-left">' +
			'	            <thead>' +
			'	            </thead>' +
			'	            <tbody></tbody>' +
			'	        </table>' +
			'	    </div>' +
			'	</div>' +
			'	<div class="transfer-body-center">' +
			'	    <div class="transfer-action">' +
			'	        <input type="button" name="leftToRight" value=">>" />' +
			'	        <input type="button" name="rightToLeft" value="<<" />' +
			'	    </div>' +
			'	</div>' +
			'	<div class="transfer-body-right">' +
			'	    <div class="transfer-header">' +
			'	        <div class="transfer-title"></div>' +
			'	    </div>' +
			'	    <div class="transfer-container">' +
			'	        <table class="transfer-table transfer-table-right">' +
			'	            <thead>' +
			'	            </thead>' +
			'	            <tbody></tbody>' +
			'	        </table>' +
			'	    </div>' +
			'	</div>' +
			'</div>' +
			'</div>',
		checkboxTd: '<td>' +
			'	<input type="checkbox">' +
			'</td>',
		checkboxTh: '<th class="th-check">' +
			'	<input type="checkbox" name="select_all">' +
			'</th>',
	}

	var columnFormatter = function (value) {
		return value ? value : "";
	}

	// 默认参数
	var defaults = {
		container: templates.container,
		title: ["穿梭框", "左边区域", "右边区域"],
		mutil: true,
		size: "middle",
		className: 'transfer-modal',
		data: [], // left table data
		selectedData: [], // right table data
		columns: [],
		primaryKey: "id", // 列表数据主键字段：默认id
		success: function () {
			throw new Error("Missing success callback option");
		},
		cancle: function () {}
	}

	function mergeArguments(defaults, args) {
		return $.extend(true, {}, defaults, args);
	}

	function getDialog(options) {
		return bootbox.dialog({
			message: options.container,
			title: options.title[0],
			size: options.size,
			className: options.className,
			buttons: {
				success: {
					label: '确认',
					className: 'btn-confirm',
					callback: options.success
				},
				cancle: {
					label: "取消",
					className: "btn-cancel",
					callback: options.cancle
				}
			}
		});
	}

	function createHeader(columns) {
		var $tr = $('<tr></tr>');
		$tr.append($(templates.checkboxTh));
		columns && columns.length > 0 && columns.forEach(function (column) {
			$tr.append('<th>' + column.label + '</th>');
		});
		return $tr;
	}

	function createTr(columns, data) {
		var $tr = $('<tr></tr>');
		$tr.append($(templates.checkboxTd));
		columns && columns.length > 0 && columns.forEach(function (column) {
			column.formatter = column.formatter || columnFormatter;
			$tr.append('<td>' + column.formatter(data[column.name], data) + '</td>');
		});
		return $tr;
	}

	var exports = {};

	exports._init = function (opts) {
		// 合并配置信息
		var options = this.options = mergeArguments(defaults, opts);
		// 列配置
		this.config = {};
		this.config.columns = this.options.columns || [];
		if (this.config.columns.length === 0) {
			throw new Error("Missing a required parameter columns.");
		}
		this._data = []; // 存储列表数据
		this.$dialog = getDialog(options);
		return this;
	}

	exports.init = function () {
		var that = this;
		var options = this._init(arguments[0]).options;
		// 模态框
		var $dialog = this.$dialog;
		// 左边列表
		var $leftBody = $dialog.find(".transfer-body-left"),
			$leftTable = $leftBody.find("table.transfer-table-left"),
			$leftThead = $leftTable.find("thead"),
			$leftTbody = $leftTable.find("tbody");
		// 右边列表
		var $rightBody = $dialog.find(".transfer-body-right"),
			$rightTable = $rightBody.find("table.transfer-table-right"),
			$rightThead = $rightTable.find("thead"),
			$rightTBody = $rightTable.find("tbody");
		// 中间操作
		var $actions = $dialog.find(".transfer-body-center .transfer-action"),
			$leftToRight = $actions.find("input[name=leftToRight]"),
			$rightToLeft = $actions.find("input[name=rightToLeft]");

		// 添加表头
		$leftThead.append(createHeader(this.config.columns));
		$rightThead.append(createHeader(this.config.columns));

		// 设置列表标题
		$leftBody.find(".transfer-title").html(options.title[1]);
		$rightBody.find(".transfer-title").html(options.title[2]);

		// 判断是否多选：单选（禁用全选 checkbox）
		if (!options.mutil) {
			$dialog.find(".transfer-table thead input[name=select_all]").attr("disabled", "disabled");
			$dialog.find(".transfer-table thead .checker span").css("cursor", "not-allowed");
		}

		// 加载数据
		this._loadData();

		// 左边	->	右边
		$leftToRight.on("click", function (e) {
			that.leftToRight(e);
		});

		// 右边 -> 左边
		$rightToLeft.on("click", function (e) {
			that.rightToLeft(e);
		});

		// 右边全选
		$rightThead.on("click", "input[name=select_all]", function (e) {
			if (e.target.checked) {
				$rightTBody.find("input[type=checkbox]").not(":checked").click();
			} else {
				$rightTBody.find("input[type=checkbox]:checked").sort(function (a, b) {
					return b.value - a.value;
				}).click();
			}
		});

		// 左边全选
		$leftThead.on("click", "input[name=select_all]", function (e) {
			if (e.target.checked) {
				$leftTbody.find("input[type=checkbox]").not(":checked").click();
			} else {
				$leftTbody.find("input[type=checkbox]:checked").sort(function (a, b) {
					return b.value - a.value;
				}).click();
			}
		});

		return exports;
	}

	// 加载左右列表数据
	exports._loadData = function () {
		// 加载左边列表
		var that = this,
			data = this.options.data,
			selectedData = this.options.selectedData;

		// 处理大数据量的时候分批加载
		if (data && data.length && data.length > 0) {
			for (let i = 0; i < data.length; i++) {
				const item = data[i];
				that.addToLeft(item);
			}
		}

		// 加载右边列表
		if (!this.options.mutil) {
			if (selectedData && selectedData.length && selectedData.length > 1) {
				throw new Error("Option mutil is false. Option selectedData's length is greate than 1");
			}
		}
		selectedData && selectedData.length && selectedData.length > 0 && selectedData.forEach(function (item, i) {
			that.addToRight(item);
		});
	}

	exports.addToLeft = function (data) {
		var that = this,
			$dialog = this.$dialog,
			options = this.options,
			id = data[options.primaryKey];
		// 左边列表
		var $leftBody = $dialog.find(".transfer-body-left"),
			$leftTable = $leftBody.find("table.transfer-table-left"),
			$leftTbody = $leftTable.find("tbody");
		var $tr;
		if (!this._data.hasOwnProperty(id)) {
			// 初次加载
			$tr = createTr(this.config.columns, data);
			$tr.find("input[type=checkbox]").val(id);
			this._data[id] = {
				left: true,
				selected: false,
				data: data,
				container: $tr
			}
		} else {
			// 如果以及在右边存在, 忽略
			if (this._data[id]["left"] == false) {
				return;
			}
			$tr = this._data[id]["container"];
			this._data[id]["left"] = true;
		}
		$tr.find("input[type=checkbox]").attr("checked", false);
		$tr.unbind("click").on("click", "input[type=checkbox]", function (e) {
			var value = e.target.value,
				checked = e.target.checked;
			if (options.mutil === false) {
				// 单选
				for (var _id in that._data) {
					if (that._data[_id]["selected"]) {
						that._data[_id]["container"].find("input[type=checkbox]:checked").attr("checked", false);
						that._data[_id]["selected"] = false;
					}
				}

			}
			that._data[value]["selected"] = checked;
		});
		$leftTbody.append($tr);
	}

	exports.addToRight = function (data) {
		var that = this,
			$dialog = this.$dialog,
			options = this.options,
			id = data[options.primaryKey];
		// 右边列表
		var $rightBody = $dialog.find(".transfer-body-right"),
			$rightTable = $rightBody.find("table.transfer-table-right"),
			$rightThead = $rightTable.find("thead"),
			$rightTBody = $rightTable.find("tbody");
		var $tr;
		if (!this._data.hasOwnProperty(id)) {
			// 初次加载
			$tr = createTr(this.config.columns, data);
			$tr.find("input[type=checkbox]").val(id);
			this._data[id] = {
				left: false,
				selected: false,
				data: data,
				container: $tr
			}
		} else {
			if (this._data[id]["left"] == true) {
				return;
			}
			$tr = this._data[id]["container"];
			this._data[id]["left"] = false;
		}
		$tr.find("input[type=checkbox]").attr("checked", false);
		$tr.unbind("click").on("click", "input[type=checkbox]", function (e) {
			var value = e.target.value,
				checked = e.target.checked;
			if (options.mutil === false) {
				// 单选
				for (var _id in that._data) {
					if (that._data[_id]["selected"]) {
						that._data[_id]["container"].find("input[type=checkbox]:checked").attr("checked", false);
						that._data[_id]["selected"] = false;
					}
				}

			}
			that._data[value]["selected"] = checked;
		});
		$rightTBody.append($tr);
	}

	/**
	 * 获取选中数据
	 * 
	 * @param left
	 * 		boolean	类型：true(获取左边选中数据)，false(获取右边选中数据) 
	 */
	exports.getSelectedList = function (left) {
		left = left === undefined ? true : left;
		var temp = [];
		for (var id in this._data) {
			if (this._data[id]["left"] === left && this._data[id]["selected"]) {
				temp.push(this._data[id]);
			}
		}
		return temp;
	}

	/**
	 * 获取数据
	 * 
	 * @param left
	 * 		boolean	类型：true(获取左边数据)，false(获取右边数据) 
	 */
	exports.getList = function (left) {
		left = left === undefined ? true : left;
		var temp = [];
		for (var id in this._data) {
			if (this._data[id]["left"] === left) {
				temp.push(this._data[id]);
			}
		}
		return temp;
	}

	// 左边选中数据 -> 右边
	exports.leftToRight = function (e) {
		var that = this,
			$dialog = this.$dialog,
			options = this.options;
		// 左边列表
		var $leftBody = $dialog.find(".transfer-body-left"),
			$leftTable = $leftBody.find("table.transfer-table-left"),
			$leftThead = $leftTable.find("thead"),
			$leftTbody = $leftTable.find("tbody");
		// 右边列表
		var $rightBody = $dialog.find(".transfer-body-right"),
			$rightTable = $rightBody.find("table.transfer-table-right"),
			$rightThead = $rightTable.find("thead"),
			$rightTBody = $rightTable.find("tbody");
		var selectedListLeft = this.getSelectedList();
		var rightList = this.getList(false);
		if (options.mutil) {
			$leftThead.find("input[name=select_all]").attr("checked", false);
		} else {
			rightList.length > 0 && rightList.forEach(function (item) {
				item["selected"] = false;
				item["left"] = true;
				item["container"].find("input[type=checkbox]:checked").attr("checked", false);
				$leftTbody.append(item["container"]);
			});
		}
		selectedListLeft.length > 0 && selectedListLeft.forEach(function (item) {
			item["selected"] = false;
			item["left"] = false;
			item["container"].find("input[type=checkbox]:checked").attr("checked", false);
			$rightTBody.append(item["container"]);
		});
	}

	// 右边选中数据 -> 左边
	exports.rightToLeft = function (e) {
		var that = this,
			$dialog = this.$dialog,
			options = this.options;
		// 左边列表
		var $leftBody = $dialog.find(".transfer-body-left"),
			$leftTable = $leftBody.find("table.transfer-table-left"),
			$leftThead = $leftTable.find("thead"),
			$leftTbody = $leftTable.find("tbody");
		// 右边列表
		var $rightBody = $dialog.find(".transfer-body-right"),
			$rightTable = $rightBody.find("table.transfer-table-right"),
			$rightThead = $rightTable.find("thead"),
			$rightTBody = $rightTable.find("tbody");
		var selectedRightList = this.getSelectedList(false);
		if (options.mutil) {
			$rightThead.find("input[name=select_all]").attr("checked", false);
		}
		selectedRightList.length > 0 && selectedRightList.forEach(function (item) {
			item["selected"] = false;
			item["left"] = true;
			item["container"].find("input[type=checkbox]:checked").attr("checked", false);
			$leftTbody.append(item["container"]);
		});
	}

	// 获取选中数据
	exports.getCheckedList = function () {
		var temp = [];
		for (var id in this._data) {
			var data = this._data[id];
			if (data['left'] == false) {
				temp.push(data["data"]);
			}
		}
		return temp;
	}

	// 手动加载数据
	exports.setData = function (data, selectedData) {
		var that = this,
			options = this.options;
		var leftList = this.getList();
		leftList.length > 0 && leftList.forEach(function (item) {
			item["container"].remove();
			delete that._data[item.data[options.primaryKey]];
		});
		// 加载左边列表
		data && data.length && data.length > 0 && data.forEach(function (item, i) {
			// 过滤已存在数据
			if (that._data[item[options.primaryKey]] === undefined) {
				that.addToLeft(item);
			}
		});
		if (selectedData !== undefined) {
			// 加载右边列表
			if (!this.options.mutil) {
				if (selectedData.length > 1) {
					throw new Error("Option mutil is false. Option selectedData's length is greate than 1");
				}
			}
			selectedData.length > 0 && selectedData.forEach(function (item, i) {
				that.addToRight(item);
			});
		}
	}

	return exports;
});