(function () {
  var state = {};
  var assets = {};

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function icon(src, size, alt) {
    var node = document.createElement("img");
    node.src = src;
    node.alt = alt || "";
    node.className = "icon icon--" + size;
    node.draggable = false;
    return node;
  }

  function requiredMark() {
    var wrap = el("span", "field__required");
    var mark = document.createElement("img");
    mark.src = assets.requiredMark;
    mark.alt = "required";
    mark.className = "field__required-icon";
    wrap.appendChild(mark);
    return wrap;
  }

  function fieldLabel(label, required, infoSrc) {
    var row = el("div", "field__label");
    row.appendChild(document.createTextNode(label));
    if (required) row.appendChild(requiredMark());
    if (infoSrc) row.appendChild(icon(infoSrc, 14, "info"));
    return row;
  }

  function renderBreadcrumb(header) {
    var row = el("nav", "breadcrumb");
    header.breadcrumb.forEach(function (item, index) {
      if (index > 0) row.appendChild(icon(assets.breadcrumbSeparator, 10, ""));
      var span = el("span", "breadcrumb__item" + (item.active ? " breadcrumb__item--active" : ""));
      span.textContent = item.label;
      row.appendChild(span);
    });
    return row;
  }

  function renderHeader(header) {
    var block = el("header", "header");
    block.appendChild(renderBreadcrumb(header));
    var titleArea = el("div", "title-area");
    var back = el("button", "title-area__back");
    back.type = "button";
    back.setAttribute("aria-label", "Back");
    back.appendChild(icon(header.backIcon, 20, "Back"));
    back.addEventListener("click", function () {
      alert("返回 Products 列表");
    });
    titleArea.appendChild(back);
    var title = el("h1", "title-area__title");
    title.textContent = header.title;
    titleArea.appendChild(title);
    block.appendChild(titleArea);
    return block;
  }

  function renderInlineBanner(banner) {
    var block = el("div", "inline-banner");
    var images = el("div", "inline-banner__images");
    var positions = [
      { left: 7, top: 7, w: 36, h: 48, rotate: "10.55deg", z: 1 },
      { left: 32, top: 4, w: 39, h: 53, rotate: "-7.11deg", z: 3 },
      { left: 65, top: 5, w: 40, h: 49, rotate: "16.24deg", z: 2 },
    ];
    banner.images.forEach(function (item, i) {
      var pos = positions[i] || positions[0];
      var wrap = el("div", "inline-banner__img-wrap");
      wrap.style.cssText =
        "left:" + pos.left + "px;top:" + pos.top + "px;width:" + pos.w + "px;height:" + pos.h + "px;transform:rotate(" + (item.rotate || pos.rotate) + ");z-index:" + pos.z + ";";
      var imgNode = document.createElement("img");
      imgNode.src = item.src;
      imgNode.alt = "";
      imgNode.style.width = "100%";
      imgNode.style.height = "100%";
      imgNode.style.objectFit = "cover";
      wrap.appendChild(imgNode);
      images.appendChild(wrap);
    });
    block.appendChild(images);
    var content = el("div", "inline-banner__content");
    content.appendChild(el("p", "inline-banner__text", banner.description));
    var btn = el("button", "inline-banner__btn", banner.actionLabel);
    btn.type = "button";
    content.appendChild(btn);
    block.appendChild(content);
    return block;
  }

  function clearTitlePlaceholderOnFocus(fieldKey) {
    if (fieldKey !== "productName" && fieldKey !== "productNameEn") return;
    var input = document.querySelector('[name="' + fieldKey + '"]');
    if (!input || input.value.trim()) return;
    var titleTextLive = document.querySelector('[data-preview="title-text"]');
    var titleWrap = document.querySelector('[data-preview="title"]');
    if (titleTextLive) motionText(titleTextLive, "", false, "title", fieldKey);
    if (titleWrap) titleWrap.classList.remove("phone-title--placeholder");
  }

  function restoreTitlePlaceholderOnBlur(fieldKey) {
    if (fieldKey !== "productName" && fieldKey !== "productNameEn") return;
    setTimeout(function () {
      var active = document.activeElement;
      if (active && (active.name === "productName" || active.name === "productNameEn")) return;
      var pn = document.querySelector('[name="productName"]');
      var en = document.querySelector('[name="productNameEn"]');
      var liveName = ((pn && pn.value.trim()) || (en && en.value.trim()) || "");
      var titleTextLive = document.querySelector('[data-preview="title-text"]');
      var titleWrap = document.querySelector('[data-preview="title"]');
      if (!titleTextLive) return;
      if (liveName) {
        motionText(titleTextLive, liveName, false, "title", fieldKey);
        if (titleWrap) titleWrap.classList.remove("phone-title--placeholder");
        return;
      }
      motionText(titleTextLive, state.preview.titlePlaceholder, false, "title", fieldKey);
      if (titleWrap) titleWrap.classList.add("phone-title--placeholder");
    }, 0);
  }

  function textInput(name, value, placeholder, prefix) {
    var wrap = el("div", "ttgo-input");
    if (prefix) {
      wrap.appendChild(el("span", "ttgo-input__prefix", prefix));
    }
    var input = document.createElement("input");
    input.className = "ttgo-input__field";
    input.name = name;
    input.value = value || "";
    input.placeholder = placeholder || "";
    input.addEventListener("input", function () {
      onFormChange(input.name);
    });
    if (name === "productName" || name === "productNameEn") {
      input.addEventListener("focus", function () {
        clearTitlePlaceholderOnFocus(name);
      });
      input.addEventListener("blur", function () {
        restoreTitlePlaceholderOnBlur(name);
      });
    }
    input.dataset.previewField = name;
    wrap.appendChild(input);
    return wrap;
  }

  function selectInput(name, value, chevronIcon, placeholder) {
    var wrap = el("div", "ttgo-input ttgo-input--select");
    var input = document.createElement("input");
    input.className = "ttgo-input__field";
    input.name = name;
    input.value = value || "";
    input.placeholder = placeholder || "";
    input.readOnly = true;
    input.tabIndex = -1;
    input.setAttribute("aria-readonly", "true");
    wrap.appendChild(input);
    var suffix = el("div", "ttgo-input__suffix");
    suffix.appendChild(el("div", "ttgo-input__suffix-fade"));
    suffix.appendChild(icon(chevronIcon, 20, ""));
    wrap.appendChild(suffix);
    return wrap;
  }

  function textareaInput(name, value, max) {
    var wrap = el("div", "ttgo-textarea");
    var field = document.createElement("textarea");
    field.className = "ttgo-textarea__field";
    field.name = name;
    field.value = value || "";
    field.maxLength = max;
    var counter = el("div", "ttgo-textarea__counter");
    function syncCounter() {
      counter.textContent = field.value.length + " / " + max;
    }
    field.addEventListener("input", function () {
      syncCounter();
      onFormChange(name);
    });
    field.dataset.previewField = name;
    syncCounter();
    wrap.appendChild(field);
    wrap.appendChild(counter);
    return wrap;
  }

  function renderRadioGroup(groupName, options, fixed, dine) {
    var group = el("div", "radio-group" + (dine ? " radio-group--dine" : ""));
    group.setAttribute("role", "radiogroup");
    options.forEach(function (opt, index) {
      var item = el("button", "radio-item" + (opt.selected ? " radio-item--selected" : "") + (fixed ? " radio-item--fixed" : ""));
      item.type = "button";
      item.setAttribute("role", "radio");
      item.setAttribute("aria-checked", opt.selected ? "true" : "false");
      item.dataset.group = groupName;
      item.dataset.index = String(index);
      if (opt.selected) {
        item.appendChild(icon(assets.radioSelected, 16, "selected"));
      } else {
        item.appendChild(el("span", "radio-item__dot--empty"));
      }
      item.appendChild(el("span", "radio-item__label", opt.label));
      item.addEventListener("click", function () {
        selectRadio(groupName, index);
      });
      group.appendChild(item);
    });
    return group;
  }

  function renderCheckboxList(groupName, items, plain) {
    var list = el("div", "checkbox-list");
    items.forEach(function (item, index) {
      var row = el("button", "checkbox-item" + (plain ? " checkbox-item--plain" : "") + (item.checked ? " is-checked" : ""));
      row.type = "button";
      row.dataset.group = groupName;
      row.dataset.index = String(index);
      row.appendChild(el("span", "checkbox-item__box"));
      row.appendChild(el("span", "checkbox-item__label", item.label));
      row.addEventListener("click", function () {
        toggleCheckbox(groupName, index);
      });
      list.appendChild(row);
    });
    return list;
  }

  function renderSection(title, subtitle, sectionKey, bodyBuilder, collapsed) {
    var block = el("section", "section" + (collapsed ? " is-collapsed" : ""));
    block.dataset.section = sectionKey;
    var header = el("button", "section__header" + (subtitle ? " section__header--with-sub" : ""));
    header.type = "button";
    header.setAttribute("aria-expanded", collapsed ? "false" : "true");
    if (subtitle) {
      var left = el("div", "section__header-left");
      left.appendChild(el("h2", "section__title", title));
      left.appendChild(el("p", "section__subtitle", subtitle));
      header.appendChild(left);
    } else {
      header.appendChild(el("h2", "section__title", title));
    }
    var chev = icon(assets.chevronUp, 18, "toggle");
    chev.className = "icon icon--18 section__chevron";
    header.appendChild(chev);
    header.addEventListener("click", function () {
      toggleSection(sectionKey);
    });
    block.appendChild(header);
    var body = el("div", "section__body");
    body.appendChild(bodyBuilder());
    block.appendChild(body);
    return block;
  }

  function updatePhotoRowThumb(photoRow, src) {
    var thumb = photoRow.querySelector(".photo-cover--uploaded");
    if (!src) {
      if (thumb) thumb.remove();
      return;
    }
    if (!thumb) {
      thumb = el("div", "photo-cover photo-cover--uploaded");
      thumb.appendChild(Object.assign(document.createElement("img"), { alt: "uploaded cover" }));
      thumb.appendChild(el("div", "photo-cover__label", "Cover"));
      photoRow.insertBefore(thumb, photoRow.firstChild);
    }
    thumb.querySelector("img").src = src;
  }

  function renderCoreSettings(section) {
    return renderSection(section.title, null, "core", function () {
      var fields = el("div", "section__fields");
      var f = section.fields;

      var photoField = el("div", "field");
      photoField.appendChild(fieldLabel(f.productPhotos.label, f.productPhotos.required, assets.infoCircle));
      var photoRow = el("div", "photo-row");
      if (f.productPhotos.cover) {
        var cover = el("div", "photo-cover");
        cover.appendChild(Object.assign(document.createElement("img"), { src: f.productPhotos.cover.src, alt: "cover" }));
        cover.appendChild(el("div", "photo-cover__label", f.productPhotos.cover.label));
        photoRow.appendChild(cover);
      }
      var add = el("button", "photo-add");
      add.type = "button";
      add.dataset.previewField = "productPhotos";
      add.appendChild(icon(f.productPhotos.uploadIcon, 24, "add"));
      var fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.className = "photo-file-input";
      fileInput.setAttribute("aria-hidden", "true");
      fileInput.tabIndex = -1;
      add.addEventListener("click", function () {
        fileInput.click();
      });
      fileInput.addEventListener("change", function () {
        var file = fileInput.files && fileInput.files[0];
        fileInput.value = "";
        if (!file || !/^image\//.test(file.type)) return;
        if (state.coverObjectUrl) URL.revokeObjectURL(state.coverObjectUrl);
        state.coverObjectUrl = URL.createObjectURL(file);
        state.coverImageSrc = state.coverObjectUrl;
        state.hasCoverImage = true;
        updatePhotoRowThumb(photoRow, state.coverImageSrc);
        syncPreview({ animate: true, sourceField: "productPhotos" });
      });
      photoRow.appendChild(add);
      photoField.appendChild(fileInput);
      photoField.appendChild(photoRow);
      fields.appendChild(photoField);

      var nameField = el("div", "field");
      nameField.appendChild(fieldLabel(f.productName.label, f.productName.required));
      nameField.appendChild(textInput("productName", f.productName.value, f.productName.placeholder));
      fields.appendChild(nameField);

      var nameEnField = el("div", "field");
      var nameEnLabelRow = el("div", "field__label-row");
      nameEnLabelRow.appendChild(el("div", "field__label", f.productNameEn.label));
      var aiBtn = el("button", "field__ai-btn");
      aiBtn.type = "button";
      aiBtn.appendChild(icon(f.productNameEn.aiIcon, 14, "AI"));
      aiBtn.appendChild(el("span", "field__ai-text", f.productNameEn.aiTranslationLabel));
      aiBtn.addEventListener("click", function () {
        var enInput = document.querySelector('[name="productNameEn"]');
        if (enInput) {
          enInput.value = state.productName || "Translated product name";
          enInput.dispatchEvent(new Event("input"));
        }
      });
      nameEnLabelRow.appendChild(aiBtn);
      nameEnField.appendChild(nameEnLabelRow);
      nameEnField.appendChild(textInput("productNameEn", f.productNameEn.value, f.productNameEn.placeholder));
      fields.appendChild(nameEnField);

      var priceRow = el("div", "input-row");
      var regField = el("div", "field");
      regField.appendChild(fieldLabel(f.regularPrice.label, f.regularPrice.required));
      regField.appendChild(textInput("regularPrice", f.regularPrice.value, "", f.regularPrice.prefix));
      priceRow.appendChild(regField);
      var sellField = el("div", "field");
      sellField.appendChild(fieldLabel(f.sellingPrice.label, f.sellingPrice.required));
      sellField.appendChild(textInput("sellingPrice", f.sellingPrice.value, "", f.sellingPrice.prefix));
      priceRow.appendChild(sellField);
      fields.appendChild(priceRow);

      var catField = el("div", "field");
      catField.appendChild(fieldLabel(f.category.label, f.category.required));
      catField.appendChild(selectInput("category", f.category.value, f.category.chevronIcon, f.category.placeholder));
      fields.appendChild(catField);

      var usersField = el("div", "field field--gap-12");
      usersField.appendChild(fieldLabel(f.recommendedUsers.label, f.recommendedUsers.required));
      usersField.appendChild(renderRadioGroup("recommendedUsers", f.recommendedUsers.options, false, false));
      fields.appendChild(usersField);

      var storesField = el("div", "field field--gap-12");
      storesField.appendChild(fieldLabel(f.availableStores.label, f.availableStores.required));
      var addStores = el("button", "add-stores");
      addStores.type = "button";
      addStores.dataset.previewField = "availableStores";
      var addInner = el("div", "add-stores__inner");
      var iconWrap = el("div", "add-stores__icon-wrap");
      iconWrap.appendChild(icon(f.availableStores.addIcon, 16, "add"));
      addInner.appendChild(iconWrap);
      addInner.appendChild(el("span", "add-stores__label", f.availableStores.addLabel));
      addStores.appendChild(addInner);
      storesField.appendChild(addStores);
      fields.appendChild(storesField);

      var minField = el("div", "field field--gap-12");
      minField.appendChild(fieldLabel(f.minimumPurchase.label, false));
      minField.appendChild(renderCheckboxList("minimumPurchase", [{ label: f.minimumPurchase.checkboxLabel, checked: f.minimumPurchase.checked }], true));
      fields.appendChild(minField);

      return fields;
    }, !section.expanded);
  }

  function renderAdvancedSection(section) {
    return renderSection(section.title, section.subtitle, "advanced", function () {
      var fields = el("div", "section__fields");
      var sf = section.fields;

      function addRadioField(fieldKey, field, fixed, dine, info) {
        var wrap = el("div", "field field--gap-12");
        wrap.appendChild(fieldLabel(field.label, field.required, info ? assets.infoCircleAdv : null));
        wrap.appendChild(renderRadioGroup(fieldKey, field.options, fixed, dine));
        fields.appendChild(wrap);
      }

      addRadioField("stockAvailability", sf.stockAvailability, true, false, false);
      addRadioField("salePeriod", sf.salePeriod, true, false, true);
      addRadioField("availableHours", sf.availableHours, true, false, false);
      addRadioField("validityPeriod", sf.validityPeriod, false, false, false);
      addRadioField("dineInRules", sf.dineInRules, false, true, false);

      var limitField = el("div", "field field--gap-12");
      limitField.appendChild(fieldLabel(sf.limitPurchase.label, false));
      limitField.appendChild(renderCheckboxList("limitPurchase", sf.limitPurchase.checkboxes, false));
      fields.appendChild(limitField);

      var unavailField = el("div", "field field--gap-12");
      unavailField.appendChild(fieldLabel(sf.unavailableDays.label, false));
      unavailField.appendChild(renderCheckboxList("unavailableDays", sf.unavailableDays.checkboxes, false));
      fields.appendChild(unavailField);

      var resField = el("div", "field field--gap-12");
      resField.appendChild(fieldLabel(sf.reservationRules.label, false));
      resField.appendChild(renderCheckboxList("reservationRules", sf.reservationRules.checkboxes, false));
      fields.appendChild(resField);

      var addField = el("div", "field field--gap-12");
      addField.appendChild(fieldLabel(sf.additionalInfo.label, false));
      addField.appendChild(textareaInput("additionalInfo", sf.additionalInfo.value, sf.additionalInfo.counter.max));
      fields.appendChild(addField);

      var addEnField = el("div", "field field--gap-12");
      var addEnLabelRow = el("div", "field__label-row");
      addEnLabelRow.appendChild(el("div", "field__label", sf.additionalInfoEn.label));
      var aiBtn2 = el("button", "field__ai-btn");
      aiBtn2.type = "button";
      aiBtn2.appendChild(icon(sf.additionalInfoEn.aiIcon, 14, "AI"));
      aiBtn2.appendChild(el("span", "field__ai-text", sf.additionalInfoEn.aiTranslationLabel));
      addEnLabelRow.appendChild(aiBtn2);
      addEnField.appendChild(addEnLabelRow);
      addEnField.appendChild(textareaInput("additionalInfoEn", sf.additionalInfoEn.value, sf.additionalInfoEn.counter.max));
      fields.appendChild(addEnField);

      return fields;
    }, !section.expanded);
  }

  function appendChevron(parent, chevronSrc, size) {
    parent.appendChild(icon(chevronSrc, size || 10, ""));
  }

  function renderPreviewPanel(preview) {
    var panel = el("aside", "panel-right");
    var phone = el("div", "phone-frame");

    var hero = el("div", "phone-hero");
    hero.dataset.preview = "hero";
    var heroImg = Object.assign(document.createElement("img"), { alt: "" });
    heroImg.className = "phone-hero__cover is-hidden";
    heroImg.dataset.preview = "hero-img";
    hero.appendChild(heroImg);
    var heroEmpty = el("div", "phone-hero__empty");
    heroEmpty.dataset.preview = "hero-empty";
    var heroIcon = icon(preview.heroEmptyIcon, preview.heroEmptyIconSize || 33, "");
    heroIcon.className = "phone-hero__empty-icon";
    heroEmpty.appendChild(heroIcon);
    heroEmpty.appendChild(el("span", "phone-hero__empty-label", preview.heroEmptyLabel));
    hero.appendChild(heroEmpty);
    var heroCounter = el("div", "phone-hero__counter");
    heroCounter.dataset.preview = "hero-counter";
    heroCounter.hidden = true;
    hero.appendChild(heroCounter);

    var content = el("div", "phone-content");
    content.appendChild(hero);

    var priceCard = el("div", "phone-card");
    var priceBlock = el("div", "phone-price-block");
    var priceRow = el("div", "phone-price-row");
    priceRow.innerHTML =
      '<div class="phone-price-current" data-preview="price-current"><span class="currency">Rp</span><span class="amount" data-preview="price-amount">' +
      preview.price.current +
      '</span><span class="preview-sync-cursor" data-preview-cursor="price"></span></div><div class="phone-price-old" data-preview="price-old"><span>Rp</span><span data-preview="price-original">' +
      preview.price.original +
      '<span class="preview-sync-cursor" data-preview-cursor="regular-price"></span></span></div><span class="phone-discount" data-preview="price-discount">' +
      preview.price.discount +
      "</span>";
    priceBlock.appendChild(priceRow);
    priceCard.appendChild(priceBlock);
    var titleEl = el("div", "phone-title phone-title--placeholder");
    titleEl.dataset.preview = "title";
    var titleContent = el("span", "phone-title__content");
    var titleText = el("span", "phone-title__text", preview.titlePlaceholder);
    titleText.dataset.preview = "title-text";
    titleContent.appendChild(titleText);
    var titleCursor = el("span", "preview-sync-cursor");
    titleCursor.dataset.previewCursor = "title";
    titleText.appendChild(titleCursor);
    titleEl.appendChild(titleContent);
    priceCard.appendChild(titleEl);
    content.appendChild(priceCard);

    var infoCard = el("div", "phone-card phone-info-card");
    preview.infoRows.forEach(function (row, i) {
      var infoRow = el("div", "phone-info-row");
      infoRow.dataset.preview = "info-" + i;
      infoRow.appendChild(icon(row.icon, 11, ""));
      infoRow.appendChild(el("span", "phone-info-row__text", row.text));
      appendChevron(infoRow, preview.chevronRight, 10);
      infoCard.appendChild(infoRow);
    });
    content.appendChild(infoCard);

    var hlCard = el("div", "phone-card phone-card--highlights");
    var hlTitle = el("div", "phone-section-title phone-section-title--row");
    hlTitle.appendChild(el("span", "", preview.voucherHighlights.title));
    appendChevron(hlTitle, preview.chevronRight, 10);
    hlCard.appendChild(hlTitle);
    var hlWrap = el("div", "phone-highlights-wrap");
    var hlRow = el("div", "phone-highlights");
    var hlGroup = el("div", "phone-highlight-group");

    var hi0 = el("div", "phone-highlight-item phone-highlight-item--refund");
    var icon0 = el("div", "phone-highlight-item__icon phone-highlight-item__icon--refund");
    var refundBg = el("div", "phone-highlight-item__refund-bg");
    refundBg.appendChild(Object.assign(document.createElement("img"), { src: "assets/icon-balance-refund.svg", alt: "" }));
    icon0.appendChild(refundBg);
    var shield = el("div", "phone-highlight-item__shield");
    shield.appendChild(Object.assign(document.createElement("img"), { src: "assets/icon-shield-tick.svg", alt: "" }));
    icon0.appendChild(shield);
    hi0.appendChild(icon0);
    hi0.appendChild(el("span", "", preview.voucherHighlights.items[0].text));
    hlGroup.appendChild(hi0);

    var sep0 = el("div", "phone-highlight-sep");
    sep0.appendChild(Object.assign(document.createElement("img"), { src: "assets/separator.svg", alt: "" }));
    hlGroup.appendChild(sep0);

    var hi1 = el("div", "phone-highlight-item phone-highlight-item--days");
    var icon1 = el("div", "phone-highlight-item__icon phone-highlight-item__icon--calendar");
    icon1.appendChild(Object.assign(document.createElement("img"), { src: "assets/icon-calendar-tick.svg", alt: "" }));
    hi1.appendChild(icon1);
    hi1.appendChild(el("span", "", preview.voucherHighlights.items[1].text));
    hlGroup.appendChild(hi1);

    var sep1 = el("div", "phone-highlight-sep");
    sep1.appendChild(Object.assign(document.createElement("img"), { src: "assets/separator.svg", alt: "" }));
    hlGroup.appendChild(sep1);

    var hi2 = el("div", "phone-highlight-item phone-highlight-item--save");
    var icon2 = el("div", "phone-highlight-item__icon phone-highlight-item__icon--percent");
    icon2.appendChild(Object.assign(document.createElement("img"), { src: "assets/icon-percentage.svg", alt: "" }));
    hi2.appendChild(icon2);
    hi2.appendChild(el("span", "", preview.voucherHighlights.items[2].text));
    hlGroup.appendChild(hi2);

    hlRow.appendChild(hlGroup);
    hlWrap.appendChild(hlRow);
    hlCard.appendChild(hlWrap);
    content.appendChild(hlCard);

    var notesCard = el("div", "phone-card phone-notes");
    notesCard.appendChild(el("div", "phone-section-title", preview.thingsToNote.title));
    var notesList = el("div", "phone-notes-list");
    preview.thingsToNote.items.forEach(function (item, i) {
      var note = el("div", "phone-note-item");
      note.dataset.preview = "note-" + i;
      note.appendChild(icon(item.icon + "?v=536140702", 11, ""));
      var body = el("div", "phone-note-item__body");
      body.appendChild(el("div", "phone-note-item__title", item.title));
      body.appendChild(el("div", "phone-note-item__desc", item.description));
      note.appendChild(body);
      notesList.appendChild(note);
    });
    notesCard.appendChild(notesList);
    content.appendChild(notesCard);

    phone.appendChild(content);

    var ctaBar = el("div", "phone-cta-bar");
    var ctaBtn = el("button", "phone-cta-btn");
    ctaBtn.type = "button";
    ctaBtn.dataset.preview = "cta";
    ctaBtn.textContent = preview.ctaPrefix + preview.price.current;
    ctaBar.appendChild(ctaBtn);
    ctaBar.appendChild(el("div", "phone-home-indicator")).appendChild(el("div", "phone-home-indicator__bar"));
    phone.appendChild(ctaBar);

    panel.appendChild(phone);
    return panel;
  }

  function renderFooter(footer) {
    var block = el("footer", "footer");
    var actions = el("div", "footer__actions");
    var save = el("button", "btn btn--secondary", footer.saveLabel);
    save.type = "button";
    var confirm = el("button", "btn btn--primary", footer.confirmLabel);
    confirm.type = "button";
    confirm.addEventListener("click", function () {
      alert("Confirm product publish");
    });
    actions.appendChild(save);
    actions.appendChild(confirm);
    block.appendChild(actions);
    return block;
  }

  function initState(data) {
    state = {
      productName: data.coreSettings.fields.productName.value,
      productNameEn: data.coreSettings.fields.productNameEn.value,
      regularPrice: data.coreSettings.fields.regularPrice.value,
      sellingPrice: data.coreSettings.fields.sellingPrice.value,
      category: data.coreSettings.fields.category.value,
      recommendedUsers: getSelectedLabel(data.coreSettings.fields.recommendedUsers.options),
      dineInRules: getSelectedLabel(data.advancedInformation.fields.dineInRules.options),
      validityDays: getSelectedLabel(data.advancedInformation.fields.validityPeriod.options).replace(/\D/g, "") || "60",
      hasCoverImage: !!data.coreSettings.fields.productPhotos.cover,
      coverImageSrc: data.coreSettings.fields.productPhotos.cover
        ? data.coreSettings.fields.productPhotos.cover.src
        : "",
      coverObjectUrl: null,
      storeCount: 0,
      preview: data.preview,
    };
    state.groups = {
      recommendedUsers: data.coreSettings.fields.recommendedUsers.options,
      stockAvailability: data.advancedInformation.fields.stockAvailability.options,
      salePeriod: data.advancedInformation.fields.salePeriod.options,
      availableHours: data.advancedInformation.fields.availableHours.options,
      validityPeriod: data.advancedInformation.fields.validityPeriod.options,
      dineInRules: data.advancedInformation.fields.dineInRules.options,
      limitPurchase: data.advancedInformation.fields.limitPurchase.checkboxes,
      unavailableDays: data.advancedInformation.fields.unavailableDays.checkboxes,
      reservationRules: data.advancedInformation.fields.reservationRules.checkboxes,
      minimumPurchase: [{ label: data.coreSettings.fields.minimumPurchase.checkboxLabel, checked: data.coreSettings.fields.minimumPurchase.checked }],
    };
  }

  function getSelectedLabel(options) {
    var found = options.find(function (o) {
      return o.selected;
    });
    return found ? found.label : "";
  }

  function selectRadio(groupName, index) {
    var options = state.groups[groupName];
    if (!options) return;
    options.forEach(function (opt, i) {
      opt.selected = i === index;
    });
    document.querySelectorAll('.radio-item[data-group="' + groupName + '"]').forEach(function (btn, i) {
      var selected = i === index;
      btn.classList.toggle("radio-item--selected", selected);
      btn.setAttribute("aria-checked", selected ? "true" : "false");
      btn.innerHTML = "";
      if (selected) {
        btn.appendChild(icon(assets.radioSelected, 16, "selected"));
      } else {
        btn.appendChild(el("span", "radio-item__dot--empty"));
      }
      btn.appendChild(el("span", "radio-item__label", options[i].label));
    });
    if (groupName === "recommendedUsers") state.recommendedUsers = options[index].label;
    if (groupName === "dineInRules") state.dineInRules = options[index].label;
    if (groupName === "validityPeriod") state.validityDays = options[index].label.replace(/\D/g, "") || state.validityDays;
    if (window.PreviewMotion) PreviewMotion.onFieldFocus(groupName);
    syncPreview({ animate: true, sourceField: groupName });
  }

  function toggleCheckbox(groupName, index) {
    var items = state.groups[groupName];
    if (!items) return;
    items[index].checked = !items[index].checked;
    var btn = document.querySelector('.checkbox-item[data-group="' + groupName + '"][data-index="' + index + '"]');
    if (btn) btn.classList.toggle("is-checked", items[index].checked);
    if (window.PreviewMotion) PreviewMotion.onFieldFocus(groupName);
    syncPreview({ animate: true, sourceField: groupName });
  }

  function toggleSection(sectionKey) {
    var section = document.querySelector('.section[data-section="' + sectionKey + '"]');
    if (!section) return;
    var collapsed = section.classList.toggle("is-collapsed");
    var header = section.querySelector(".section__header");
    if (header) header.setAttribute("aria-expanded", collapsed ? "false" : "true");
  }

  function calcDiscount(regular, selling) {
    var r = parseMoney(regular);
    var s = parseMoney(selling);
    if (!r || !s || s >= r) return "0%";
    return "-" + Math.round((1 - s / r) * 100) + "%";
  }

  function paxFromLabel(label) {
    if (label.indexOf("1 person") >= 0) return "1 person";
    if (label.indexOf("2 people") >= 0) return "2 person";
    if (label.indexOf("3-4") >= 0) return "3-4 people";
    return "2 person";
  }

  function dineInfoFromRules(label) {
    if (label.indexOf("Dine-in only") >= 0) return "Dine in only · Valid daily";
    if (label.indexOf("Take away") >= 0) return "Take away only · Valid daily";
    return "Dine in & take away · Valid daily";
  }

  function noteRedemptionDesc() {
    var desc = "Voucher expires within " + state.validityDays + " days of purchase";
    (state.groups.unavailableDays || []).forEach(function (item) {
      if (item.checked && /public holidays/i.test(item.label)) {
        desc += " and can not valid on public holidays";
      }
    });
    return desc;
  }

  function noteAvailableTimeDesc() {
    var label = getSelectedLabel(state.groups.availableHours);
    var desc = /Specified/i.test(label)
      ? "Voucher can be redeemed during specified hours only"
      : state.preview.thingsToNote.items[2].description;
    var suffixes = [];
    (state.groups.unavailableDays || []).forEach(function (item) {
      if (!item.checked) return;
      if (/certain days of the week/i.test(item.label)) {
        suffixes.push("not valid on certain days of the week");
      }
      if (/specific date/i.test(item.label)) {
        suffixes.push("not valid on specific dates");
      }
    });
    if (suffixes.length) {
      desc += " and is " + suffixes.join(", ");
    }
    return desc;
  }

  function syncDineNoteFields(animate, sourceField) {
    var noteDine = document.querySelector('[data-preview="note-0"] .phone-note-item__title');
    var noteDineDesc = document.querySelector('[data-preview="note-0"] .phone-note-item__desc');
    if (!noteDine || !noteDineDesc) return;
    if (state.dineInRules.indexOf("Dine-in only") >= 0) {
      motionText(noteDine, "Dine-in only", animate, "note0", sourceField);
      motionText(noteDineDesc, "This voucher is for dine-in use only", animate, "note0", sourceField);
    } else if (state.dineInRules.indexOf("Take away") >= 0) {
      motionText(noteDine, "Take away only", animate, "note0", sourceField);
      motionText(noteDineDesc, "This voucher is for take away use only", animate, "note0", sourceField);
    } else {
      motionText(noteDine, "Dine-in & take away", animate, "note0", sourceField);
      motionText(noteDineDesc, "Both dine-in and take away are supported", animate, "note0", sourceField);
    }
  }

  function syncLivePreviewFields(animate, sourceField) {
    var p = state.preview;
    var info0 = document.querySelector('[data-preview="info-0"] .phone-info-row__text');
    motionText(info0, dineInfoFromRules(state.dineInRules), animate, "info0", sourceField);

    syncDineNoteFields(animate, sourceField);

    var noteRedeem = document.querySelector('[data-preview="note-1"] .phone-note-item__desc');
    if (noteRedeem) {
      motionText(noteRedeem, noteRedemptionDesc(), animate, "note1", sourceField);
    }

    var noteHours = document.querySelector('[data-preview="note-2"] .phone-note-item__desc');
    if (noteHours) {
      motionText(noteHours, noteAvailableTimeDesc(), animate, "note2", sourceField);
    }

    var notePax = document.querySelector('[data-preview="note-3"] .phone-note-item__desc');
    if (notePax) {
      motionText(
        notePax,
        state.recommendedUsers
          ? "Ideal for " + paxFromLabel(state.recommendedUsers)
          : p.thingsToNote.items[3].description,
        animate,
        "note3",
        sourceField
      );
    }

    var noteRes = document.querySelector('[data-preview="note-4"] .phone-note-item__desc');
    if (noteRes) {
      var resRequired = (state.groups.reservationRules || []).some(function (item) {
        return item.checked;
      });
      motionText(
        noteRes,
        resRequired
          ? p.thingsToNote.items[4].description
          : "No advance reservation is required to redeem this voucher",
        animate,
        "note4",
        sourceField
      );
    }

    var noteLimit = document.querySelector('[data-preview="note-5"] .phone-note-item__desc');
    if (noteLimit) {
      var limits = (state.groups.limitPurchase || []).filter(function (item) {
        return item.checked;
      });
      var limitText = p.thingsToNote.items[5].description;
      if (limits.length) {
        limitText = "Limit purchase: " + limits.map(function (item) { return item.label; }).join(", ");
      }
      motionText(noteLimit, limitText, animate, "note5", sourceField);
    }

    var hiDays = document.querySelector(".phone-highlight-item--days > span");
    if (hiDays) {
      motionText(hiDays, state.validityDays + "+ days to redeem", animate, "hiDays", sourceField);
    }
  }

  function motionText(el, text, animate, fieldKey, sourceField) {
    var src = sourceField || (window.PreviewMotion && PreviewMotion.getActiveField());
    var doAnimate =
      animate && window.PreviewMotion && PreviewMotion.shouldAnimateField(src, fieldKey);
    if (window.PreviewMotion) {
      PreviewMotion.setText(el, text, doAnimate);
    } else if (el) {
      el.textContent = text;
    }
  }

  function onFormChange(sourceField) {
    var pn = document.querySelector('[name="productName"]');
    var sp = document.querySelector('[name="sellingPrice"]');
    var rp = document.querySelector('[name="regularPrice"]');
    if (pn) state.productName = pn.value;
    if (sp) state.sellingPrice = sp.value;
    if (rp) state.regularPrice = rp.value;
    syncPreview({ animate: true, sourceField: sourceField });
  }

  function parseMoney(value) {
    var n = parseFloat(String(value || "").replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  function formatPriceDisplay(value) {
    var n = parseMoney(value);
    if (!n) return "0";
    return String(value).trim() || "0";
  }

  function getCtaLabel() {
    return state.preview.ctaPrefix + formatPriceDisplay(state.sellingPrice);
  }

  function isFormFilled() {
    return !!(state.productName && state.productName.trim());
  }

  function setPriceExtrasVisible(visible) {
    var oldWrap = document.querySelector('[data-preview="price-old"]');
    var discountEl = document.querySelector('[data-preview="price-discount"]');
    if (oldWrap) oldWrap.hidden = !visible;
    if (discountEl) discountEl.hidden = !visible;
  }

  function updateHeroPreview(animate) {
    var heroImg = document.querySelector('[data-preview="hero-img"]');
    if (!heroImg) return;

    var showImage = state.hasCoverImage && state.coverImageSrc;
    if (showImage && !heroImg.getAttribute("src")) {
      heroImg.setAttribute("src", state.coverImageSrc);
    }

    if (window.PreviewMotion) {
      PreviewMotion.crossfadeHero(!!showImage, state.coverImageSrc, !!animate);
      return;
    }

    var heroEmpty = document.querySelector('[data-preview="hero-empty"]');
    var heroCounter = document.querySelector('[data-preview="hero-counter"]');
    if (!heroEmpty) return;
    if (showImage && heroImg.getAttribute("src")) {
      heroImg.classList.remove("is-hidden");
      heroEmpty.classList.add("is-hidden");
      if (heroCounter) {
        heroCounter.hidden = false;
        heroCounter.textContent = "1/1";
      }
    } else {
      heroImg.classList.add("is-hidden");
      heroImg.removeAttribute("src");
      heroEmpty.classList.remove("is-hidden");
      if (heroCounter) heroCounter.hidden = true;
    }
  }

  function syncPriceFields(animate, sourceField) {
    var p = state.preview;
    var selling = state.sellingPrice;
    var regular = state.regularPrice;
    var amountEl = document.querySelector('[data-preview="price-amount"]');
    var nextAmount = formatPriceDisplay(selling);
    motionText(amountEl, nextAmount, animate, "price", sourceField);
    var origEl = document.querySelector('[data-preview="price-original"]');
    motionText(origEl, formatPriceDisplay(regular), animate, "price", sourceField);
    var discountEl = document.querySelector('[data-preview="price-discount"]');
    motionText(discountEl, calcDiscount(regular, selling), animate, "price", sourceField);
    setPriceExtrasVisible(true);

    var ctaEl = document.querySelector('[data-preview="cta"]');
    motionText(ctaEl, getCtaLabel(), animate, "price", sourceField);
  }

  function applyDefaultPreview(options) {
    var animate = options && options.animate;
    var sourceField = options && options.sourceField;
    var p = state.preview;

    var liveSyncFields = {
      unavailableDays: true,
      limitPurchase: true,
      reservationRules: true,
      dineInRules: true,
      validityPeriod: true,
      availableHours: true,
      recommendedUsers: true,
      stockAvailability: true,
      salePeriod: true,
    };
    if (sourceField && liveSyncFields[sourceField]) {
      return;
    }

    if (sourceField === "regularPrice" || sourceField === "sellingPrice") {
      syncPriceFields(animate, sourceField);
      return;
    }
    if (sourceField === "productPhotos") {
      updateHeroPreview(animate);
      return;
    }

    if (sourceField === "productPhotos") {
      updateHeroPreview(animate);
      return;
    }
    if (sourceField === "productName" || sourceField === "productNameEn") {
      var titleTextLive = document.querySelector('[data-preview="title-text"]');
      var nameInput = document.querySelector('[name="' + sourceField + '"]');
      var titleWrap = document.querySelector('[data-preview="title"]');
      if (titleTextLive && nameInput) {
        var liveName = nameInput.value.trim();
        motionText(titleTextLive, liveName || p.titlePlaceholder, animate, "title", sourceField);
        if (titleWrap) titleWrap.classList.toggle("phone-title--placeholder", !liveName);
      }
      return;
    }

    var titleText = document.querySelector('[data-preview="title-text"]');
    var titleEl = document.querySelector('[data-preview="title"]');
    if (titleText) {
      motionText(titleText, p.titlePlaceholder, animate, "title", sourceField);
      if (titleEl) titleEl.classList.add("phone-title--placeholder");
    }

    var amountEl = document.querySelector('[data-preview="price-amount"]');
    motionText(amountEl, p.price.current, false, "price", sourceField);
    var origEl = document.querySelector('[data-preview="price-original"]');
    motionText(origEl, p.price.original, false, "price", sourceField);
    var discountEl = document.querySelector('[data-preview="price-discount"]');
    motionText(discountEl, p.price.discount, false, "price", sourceField);
    setPriceExtrasVisible(true);

    var ctaEl = document.querySelector('[data-preview="cta"]');
    motionText(ctaEl, getCtaLabel(), false, "price", sourceField);

    p.infoRows.forEach(function (row, i) {
      var textEl = document.querySelector('[data-preview="info-' + i + '"] .phone-info-row__text');
      motionText(textEl, row.text, false, "info" + i, sourceField);
    });

    p.thingsToNote.items.forEach(function (item, i) {
      var note = document.querySelector('[data-preview="note-' + i + '"]');
      if (!note) return;
      var title = note.querySelector(".phone-note-item__title");
      var desc = note.querySelector(".phone-note-item__desc");
      motionText(title, item.title, false, "note" + i, sourceField);
      motionText(desc, item.description, false, "note" + i, sourceField);
    });

    var hiItems = document.querySelectorAll(".phone-highlight-item > span");
    p.voucherHighlights.items.forEach(function (item, i) {
      if (hiItems[i]) motionText(hiItems[i], item.text, false, "hi" + i, sourceField);
    });

    updateHeroPreview(false);
  }

  function syncPreview(options) {
    var animate = options && options.animate;
    var sourceField = options && options.sourceField;
    if (!isFormFilled()) {
      applyDefaultPreview(options);
      syncLivePreviewFields(animate, sourceField);
      return;
    }

    var p = state.preview;
    var titleText = document.querySelector('[data-preview="title-text"]');
    var titleEl = document.querySelector('[data-preview="title"]');
    if (titleText) {
      motionText(titleText, state.productName.trim(), animate, "title", sourceField);
      if (titleEl) titleEl.classList.remove("phone-title--placeholder");
    }

    syncPriceFields(animate, sourceField);

    var info1 = document.querySelector('[data-preview="info-1"] .phone-info-row__text');
    if (info1) {
      motionText(
        info1,
        state.storeCount > 0 ? "Redeem at " + state.storeCount + " outlets" : p.infoRows[1].text,
        animate,
        "info1",
        sourceField
      );
    }

    syncLivePreviewFields(animate, sourceField);

    var noteOther = document.querySelector('[data-preview="note-7"]');
    var addInfoInput = document.querySelector('[name="additionalInfo"]');
    var addInfoText = addInfoInput ? addInfoInput.value.trim() : "";
    if (noteOther) {
      var showOther = !!addInfoText;
      noteOther.hidden = !showOther;
      if (showOther) {
        var noteOtherDesc = noteOther.querySelector(".phone-note-item__desc");
        motionText(noteOtherDesc, addInfoText, animate, "note7", sourceField);
      }
    }

    if (sourceField === "productPhotos") {
      updateHeroPreview(animate);
    }
  }

  function renderPage(data) {
    assets = data.assets;
    initState(data);
    var app = document.getElementById("app");
    app.innerHTML = "";
    var body = el("div", "page__body");
    var left = el("div", "panel-left");
    left.appendChild(renderHeader(data.header));
    var scroll = el("div", "form-scroll");
    scroll.appendChild(renderInlineBanner(data.inlineBanner));
    scroll.appendChild(renderCoreSettings(data.coreSettings));
    scroll.appendChild(renderAdvancedSection(data.advancedInformation));
    left.appendChild(scroll);
    body.appendChild(left);
    body.appendChild(renderPreviewPanel(data.preview));
    app.appendChild(body);
    app.appendChild(renderFooter(data.footer));
    syncPreview({ animate: false });
    if (window.PreviewMotion) PreviewMotion.init(scroll);
  }

  function loadData() {
    if (window.PAGE_DATA) return Promise.resolve(window.PAGE_DATA);
    return fetch("data.json").then(function (res) {
      if (!res.ok) throw new Error("Failed to load data.json");
      return res.json();
    });
  }

  loadData()
    .then(renderPage)
    .catch(function (err) {
      document.getElementById("app").innerHTML =
        '<p style="padding:24px;color:#cd3540">预览加载失败：' + err.message + "</p>";
    });
})();
