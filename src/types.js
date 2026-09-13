/*
 * The contract. BUILD_PLAN.md §02.
 *
 * Every lane codes against these four shapes. Plain JSDoc rather than
 * TypeScript so the CRA build needs no extra toolchain — the discipline is the
 * same either way: nothing but a VerteResult reaches a component.
 *
 * When the data source changes — page-read listings today, a marketplace API
 * tomorrow — what changes is whatever PRODUCES a VerteResult. What consumes
 * one never moves.
 */

/**
 * What the content script scrapes off the page.
 * @typedef  {Object}       ProductContext
 * @property {string}       title
 * @property {number|null}  price
 * @property {string}       currency
 * @property {string}       category    normalized slug: "mini-fridge"
 * @property {string|null}  imageUrl
 * @property {string}       sourceUrl
 */

/**
 * One secondhand option, from any source.
 * @typedef  {Object}       UsedOption
 * @property {'amazon-used'|'bestbuy-openbox'|'campus'} source
 * @property {string}       title
 * @property {number}       price
 * @property {string}       url
 * @property {string|null}  imageUrl
 * @property {string}       condition
 * @property {number}      [distanceMi]  campus listings only
 */

/**
 * What we know about buying this category used.
 * @typedef  {Object}       CategoryGuidance
 * @property {string}       category
 * @property {'safe'|'check'|'avoid'} verdict
 * @property {string[]}     checkTips
 * @property {number}       embodiedCo2Kg  0 when we have no citation
 * @property {string}       co2Source      '' when we have no citation
 * @property {string}       note
 * @property {boolean}      bulky          needs a car to collect
 */

/**
 * A lower-carbon product to buy instead. MODEL-GENERATED — an estimate, and
 * always marked as one. `url` is a retailer search, never an invented listing.
 * @typedef  {Object}       Alternative
 * @property {'ai'}         source
 * @property {string}       title
 * @property {string}       why                 one sentence naming the mechanism
 * @property {number|null}  co2SavingKgPerYear  null unless reasoned from energy use
 * @property {string}       url
 * @property {true}         estimated
 */

/**
 * The one object the UI renders. Nothing else reaches a component.
 * @typedef  {Object}            VerteResult
 * @property {ProductContext}    product
 * @property {CategoryGuidance}  guidance       sourced, from Snowflake
 * @property {Alternative[]}     alternatives   estimated, from the model
 * @property {string|null}       scarcityReason why a category has few lower-carbon options (voice)
 * @property {object|null}       context        budget, deadline, noCar, country — steers the pick
 * @property {string[]}          contextTags    the same context as short on-screen tags
 * @property {UsedOption[]}      pageOptions    anything the page itself reported
 * @property {number|null}       embodiedCo2Kg  sourced manufacturing figure, or null
 * @property {number|null}       co2AvoidedKg
 * @property {number|null}       savingsUsd
 */

export {};
