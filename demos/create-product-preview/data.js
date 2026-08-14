window.PAGE_DATA = {
  "meta": {
    "figmaFileKey": "5TyZo5MLgEm6FNlwy3AYis",
    "figmaNodeId": "605:57670",
    "pageName": "Product publish",
    "width": 1440,
    "height": 860
  },
  "header": {
    "breadcrumb": [
      { "label": "Products", "active": false },
      { "label": "Create product", "active": true }
    ],
    "title": "Create product",
    "backIcon": "assets/chevron-left-fill.svg"
  },
  "inlineBanner": {
    "description": "Choose an item from Menu items to auto-fill this form.",
    "actionLabel": "Choose item",
    "images": [
      { "src": "assets/banner-food-1.png", "rotate": "10.55deg", "left": "0", "zIndex": 1 },
      { "src": "assets/banner-food-3.png", "rotate": "-7.11deg", "left": "32px", "zIndex": 3 },
      { "src": "assets/banner-food-2.png", "rotate": "16.24deg", "left": "65px", "zIndex": 2 }
    ]
  },
  "coreSettings": {
    "title": "Core settings",
    "expanded": true,
    "fields": {
      "productPhotos": {
        "label": "Product photos",
        "required": true,
        "cover": null,
        "uploadIcon": "assets/plus.svg"
      },
      "productName": {
        "label": "Product name",
        "required": true,
        "placeholder": "Input single product name",
        "value": ""
      },
      "productNameEn": {
        "label": "Product name(English)",
        "placeholder": "Translate to English with AI",
        "aiTranslationLabel": "AI Translation",
        "aiIcon": "assets/pen-star.svg",
        "value": ""
      },
      "regularPrice": {
        "label": "Regular price",
        "required": true,
        "prefix": "Rp",
        "value": ""
      },
      "sellingPrice": {
        "label": "Selling price",
        "required": true,
        "prefix": "Rp",
        "value": ""
      },
      "category": {
        "label": "Category",
        "required": true,
        "value": "Dining / DrinksDrinks/ Tea",
        "placeholder": "Select category",
        "chevronIcon": "assets/chevron-down-thin.svg"
      },
      "recommendedUsers": {
        "label": "Number of recommended users",
        "required": true,
        "options": [
          { "label": "1 person", "selected": false },
          { "label": "2 people", "selected": false },
          { "label": "3-4 people", "selected": false },
          { "label": "Custorm", "selected": false }
        ]
      },
      "availableStores": {
        "label": "Available stores",
        "required": true,
        "addLabel": "Add stores",
        "addIcon": "assets/plus-fill.svg"
      },
      "minimumPurchase": {
        "label": "Minimum Purchase Quantity",
        "checkboxLabel": "Customers must buy more than 1 voucher",
        "checked": false
      }
    }
  },
  "advancedInformation": {
    "title": "Advanced Information",
    "subtitle": "System defaults applied, click to expand and update",
    "expanded": true,
    "fields": {
      "stockAvailability": {
        "label": "Stock availability",
        "required": true,
        "options": [
          { "label": "Unlimited", "selected": true },
          { "label": "Limited", "selected": false }
        ]
      },
      "salePeriod": {
        "label": "Sale Period",
        "required": true,
        "hasInfo": true,
        "options": [
          { "label": "Unlimited", "selected": true },
          { "label": "Limited", "selected": false }
        ]
      },
      "availableHours": {
        "label": "Available hours",
        "required": true,
        "options": [
          { "label": "Business hours", "selected": true },
          { "label": "Specified hours only", "selected": false }
        ]
      },
      "validityPeriod": {
        "label": "Validity period (from purchase date)",
        "required": true,
        "options": [
          { "label": "60 days", "selected": true },
          { "label": "45 days", "selected": false },
          { "label": "30 days", "selected": false }
        ]
      },
      "dineInRules": {
        "label": "Dine-in and take away rules",
        "required": true,
        "options": [
          { "label": "Both supported", "selected": true },
          { "label": "Dine-in only", "selected": false },
          { "label": "Take away only", "selected": false }
        ]
      },
      "limitPurchase": {
        "label": "Limit purchase quantity",
        "checkboxes": [
          { "label": "Per user", "checked": false },
          { "label": "Per user per day", "checked": false }
        ]
      },
      "unavailableDays": {
        "label": "Unavailable days",
        "checkboxes": [
          { "label": "Not available on certain days of the week", "checked": false },
          { "label": "Not available on public holidays", "checked": false },
          { "label": "Not available on specific date", "checked": false }
        ]
      },
      "reservationRules": {
        "label": "Reservation rules",
        "checkboxes": [
          { "label": "Reservations are required before redemption at the store", "checked": false }
        ]
      },
      "additionalInfo": {
        "label": "Additional information",
        "value": "",
        "counter": { "current": 0, "max": 140 }
      },
      "additionalInfoEn": {
        "label": "Additional information(English)",
        "aiTranslationLabel": "AI Translation",
        "aiIcon": "assets/pen-star.svg",
        "value": "",
        "counter": { "current": 0, "max": 140 }
      }
    }
  },
  "preview": {
    "titlePlaceholder": "Product name (To be filled in)",
    "heroEmptyLabel": "Images to be uploaded",
    "heroEmptyIcon": "assets/icon-fork-knife.svg",
    "heroEmptyIconSize": 29,
    "chevronRight": "assets/chevron-right-slim.svg",
    "price": {
      "current": "0",
      "original": "0",
      "discount": "0%"
    },
    "infoRows": [
      {
        "icon": "assets/icon-calendar.svg",
        "text": "Dine in only · Valid daily"
      },
      {
        "icon": "assets/icon-store.svg",
        "text": "Redeem at 132 outlets"
      }
    ],
    "voucherHighlights": {
      "title": "Voucher highlights",
      "items": [
        {
          "text": "Auto-refund unused vouchers"
        },
        {
          "text": "30+ days to redeem"
        },
        {
          "text": "Save 20% at 128 stores"
        }
      ]
    },
    "thingsToNote": {
      "title": "Things to note",
      "items": [
        {
          "icon": "assets/icon-fork-knife.svg",
          "title": "Dine-in only",
          "description": "This voucher is for dine-in use only"
        },
        {
          "icon": "assets/icon-calendar-tick-2.svg",
          "title": "Redemption time",
          "description": "Voucher expires within 30 days of purchase and can not valid on public holidays"
        },
        {
          "icon": "assets/icon-clock.svg",
          "title": "Available Time",
          "description": "Voucher can be redeemed during the merchant's operating hours"
        },
        {
          "icon": "assets/icon-two-person.svg",
          "title": "Recommended number of pax",
          "description": "Ideal for 2 person"
        },
        {
          "icon": "assets/icon-calendar-2.svg",
          "title": "Reservation Rules",
          "description": "You must make a reservation 30 days in advance to redeem this voucher"
        }
      ]
    },
    "ctaLabel": "Buy for Rp33.500",
    "ctaPrefix": "Buy for Rp"
  },
  "footer": {
    "saveLabel": "Save",
    "confirmLabel": "Confirm",
    "divider": "assets/footer-line.svg"
  },
  "assets": {
    "requiredMark": "assets/required-mark.svg",
    "infoCircle": "assets/info-circle.svg",
    "infoCircleAdv": "assets/info-circle-adv.svg",
    "chevronUp": "assets/chevron-up-fill.svg",
    "radioSelected": "assets/radio-selected.svg",
    "breadcrumbSeparator": "assets/breadcrumb-separator.svg"
  }
}
;
