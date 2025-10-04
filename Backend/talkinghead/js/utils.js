/**
 * Utility Functions Module
 * JWT auth, configuration management, i18n helpers, and general utilities
 */

import { API_PROXIES, i18n } from './config.js';

// =============================================================================
// GLOBALS & STATE
// =============================================================================

// JWT state
let jwtExpires = 0;
let jwt = '';

// Configuration state
export let CFG = {
  session: 0,
  sessions : [
    {
      name: "Nimetön",
      theme: { lang: 'en', brightness:"dark", ratio:"wide", layout:"port" },
      view: { image: 'NONE' },
      avatar: {},
      camera: { frame: 'full' },
      ai: {},
      voice: { background: "NONE", type: "google", google:{ id: "en-GB-Standard-A"}, lipsync:{ lang: 'en' } }
    },
    {
      name: "Nimetön 2",
      theme: { lang: 'en', brightness: "dark", ratio: "wide", layout: "land" },
      view: { image: 'NONE' },
      avatar: {},
      camera: { frame: 'upper' },
      ai: {},
      voice: { background: "NONE", type: "google", google:{ id: "en-GB-Standard-A"}, lipsync:{ lang: 'en' } }
    },
  ]
};

let loadingConfig = false;

// =============================================================================
// JWT AUTHENTICATION
// =============================================================================

/**
 * Get JSON Web Token for authenticated API calls
 * Caches the token and refreshes when needed
 */
export async function jwtGet() {
  const limit = Math.round(Date.now() / 1000) + 60;
  if ( jwtExpires < limit ) {
    try {
      const o = await (await fetch( API_PROXIES.jwt, { cache: "no-store" } )).json();
      if ( o && o.jwt ) {
        const b64Url = o.jwt.split('.')[1];
        const b64 = b64Url.replace(/-/g, '+').replace(/_/g, '/');
        const s = decodeURIComponent( window.atob(b64).split('').map( (c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const p = JSON.parse(s);
        jwtExpires = (p && p.exp) ? p.exp : 0;
        jwt = o.jwt;
      } else {
        jwt = '';
        jwtExpires = 0;
      }
    } catch(e) {
      console.error(e);
      jwt = '';
      jwtExpires = 0;
    }
  }
  return jwt.slice();
}

// =============================================================================
// CONFIGURATION MANAGEMENT
// =============================================================================

/**
 * Get/set config value for the current session
 * @param {string} key - Dot-separated path (e.g., 'voice-google-rate')
 * @param {*} value - Value to set (optional)
 */
export function cfg(key, value) {
  if ( key === undefined ) return CFG.sessions[CFG.session];
  let parts = key.split('-').map( x => isNaN(x) ? x : parseInt(x) );
  if ( value === undefined ) {
    return parts.reduce( (o,p) => o ? o[p] : undefined, CFG.sessions[CFG.session] );
  } else {
    parts.reduce( (o,p,i) => {
      const def = (typeof parts[i+1] === 'number') ? [] : {};
      return (o[p] = (parts.length-1) === i ? value : (o[p] || def));
    }, CFG.sessions[CFG.session] );
  }
}

/**
 * Load configuration from sessionStorage
 */
export function initConfig() {
  try {
    let json = sessionStorage.getItem('talkinghead');
    if (json) {
      CFG = JSON.parse(json);
    }
  } catch(error) {
    console.error("Invalid JSON settings:", error);
  }
  
  // Make cfg available globally for debugging
  window.cfg = cfg;
}

/**
 * Save configuration to sessionStorage
 */
export function saveConfig() {
  if ( !loadingConfig ) {
    let json = JSON.stringify(CFG);
    sessionStorage.setItem("talkinghead", json);
    json = JSON.stringify( cfg() );
    d3.select("#json").property("value", json );
  }
}

/**
 * Load config for the given session
 * @param {number|null} session - Session index to load
 */
export function loadConfig(session = null, entrySelect, entryMove, scriptInit) {
  try {
    loadingConfig = true;
    let json = sessionStorage.getItem('talkinghead');
    const config = (json ? JSON.parse(json) : CFG);
    if ( config && config.hasOwnProperty("session") && config.hasOwnProperty("sessions") && config.sessions.length ) {
      CFG = config;
      if ( session !== null && session >= 0 && session < CFG.sessions.length ) {
        CFG.session = session;
        json = JSON.stringify(CFG);
        sessionStorage.setItem("talkinghead", json);
      }

      // Populate sessions
      d3.selectAll(".session").nodes().forEach( n => {
        const e = d3.select(n);
        const id = parseInt( e.property("id").split("-")[1] );
        if ( id >= 0 && id < CFG.sessions.length ) {
          e.classed("selected", (id === CFG.session) );
        } else {
          e.remove();
        }
      });
      for( let i=0; i<CFG.sessions.length; i++ ) {
        const e = d3.select("#session-"+i);
        if ( e.empty() ) {
          d3.select("#sessions").append("div")
            .property("id","session-"+i)
            .classed("session", true)
            .classed("selected", (i === CFG.session) );
        }
      }

      // Populate directory
      d3.selectAll(".entry").nodes().forEach( n => {
        const e = d3.select(n);
        const id = parseInt( e.property("id").split("-")[1] );
        if ( id >= 0 && id < CFG.sessions.length ) {
          let name = CFG.sessions[id].name;
          if ( !name || name.length === 0 ) {
            name = "Nimetön";
            CFG.sessions[id].name = name;
          }
          e.select("div")
            .classed("selected", (id === CFG.session) )
            .text( name );
        } else {
          e.remove();
        }
      });
      for( let i=0; i<CFG.sessions.length; i++ ) {
        const e = d3.select("#entry-"+i);
        if ( e.empty() ) {
          let n = d3.select("#directory").node().lastElementChild;
          let name = CFG.sessions[i].name;
          if ( !name || name.length === 0 ) {
            name = "Nimetön";
            CFG.sessions[i].name = name;
          }
          let clone = d3.select(n).clone(true);
          clone.property("id","entry-"+i);
          clone.select("[data-session]")
            .attr("data-session", i)
            .classed("selected", (i === CFG.session) )
            .text(name)
            .on('click.command', entrySelect);
          clone.selectAll("[data-entry-move]")
            .on('click.command', entryMove );
        }
      }

      // Populate settings page in specific order
      [
        "[data-item='view-url']", "[data-item='avatar-url']",
        "[data-item='avatar-body']","[data-item]"
      ].forEach( x => {
        d3.selectAll(x).nodes().forEach( (n) => {
          const e = d3.select(n);
          const item = e.attr("data-item");
          const type = e.attr("data-type");
          const range = e.attr("data-range");
          let value = cfg( item );
          if ( value !== undefined ) {
            if ( type === 'boolean' ) {
              e.classed( "selected", value )
            } else if ( type === 'option' ) {
              if ( value === e.attr("data-"+item) ) {
                e.dispatch("click");
              }
            } else if ( type === 'value' ) {
              e.property("value",value).dispatch("change");
            }
          } else {
            if ( type === 'boolean' ) {
              cfg( item, e.classed( "selected" ) );
            } else if ( type === 'option' ) {
              if ( e.classed("selected") ) {
                cfg( item, e.attr("data-"+item) );
                e.dispatch("click");
              }
            } else {
              if ( range !== null ) {
                cfg( item, parseFloat( e.property("value") ) );
              } else {
                cfg( item, e.property("value") );
              }
              e.dispatch("change");
            }
          }
        });
      });

      // Populate other parts of UI
      d3.select("#name").text( cfg("name") );
      if ( d3.select("[data-item='view-image'].selected").empty() ) {
        d3.select("[data-item='view-image']").classed("selected",true).dispatch('click');
      }
      if ( d3.select("[data-item='avatar-name'].selected").empty() ) {
        d3.select("[data-item='avatar-name']").classed("selected",true).dispatch('click');
      }
      scriptInit();
      json = JSON.stringify( cfg() );
      d3.select("#json").property("value",json);
    }
  } catch(error) {
    alert("Invalid JSON settings");
    console.error(error);
  } finally {
    loadingConfig = false;
    saveConfig();
  }
}

// =============================================================================
// INTERNATIONALIZATION (i18n)
// =============================================================================

/**
 * Get translated word
 * @param {string} w - Word to translate
 * @param {string} l - Language code
 */
export function i18nWord(w, l) {
  l = l || cfg('theme-lang') || 'en';
  return (( i18n[l] && i18n[l][w] ) ? i18n[l][w] : w);
}

/**
 * Translate all i18n elements in the DOM
 * @param {string} l - Language code
 */
export function i18nTranslate(l, site) {
  l = l || cfg('theme-lang') || 'en';

  // Text
  d3.selectAll("[data-i18n-text]").nodes().forEach( n => {
    const e = d3.select(n);
    e.text( i18nWord(e.attr("data-i18n-text"),l ) );
  });

  // Title
  d3.selectAll("[data-i18n-title]").nodes().forEach( n => {
    const e = d3.select(n);
    e.attr( 'title', i18nWord( e.attr("data-i18n-title"),l ) );
  });

  // Placeholder
  d3.selectAll("[data-i18n-placeholder]").nodes().forEach( n => {
    const e = d3.select(n);
    e.attr( 'placeholder', i18nWord( e.attr("data-i18n-placeholder"),l) );
  });

  // Site
  d3.selectAll("[data-i18n-site]").nodes().forEach( n => {
    const e = d3.select(n);
    const label = e.attr("data-i18n-site");
    const [section, ...rest] = label.split('-');
    const item = rest.join('-');
    let text = item;
    if ( site[section] && site[section][item] && site[section][item][l] ) {
      text = site[section][item][l];
    }
    e.text( text );
  });
}

// =============================================================================
// TEXT PROCESSING
// =============================================================================

/**
 * Count words in a string
 * @param {string} str - Input string
 * @returns {number} Word count
 */
export function nWords(str) {
  return str ? str.trim().split(/\s+/).length : 0;
}

/**
 * Process string for parts to exclude from speech/lip-sync
 * @param {string} s - Input string
 * @param {object|null} o - Previous state (for continued streams)
 * @returns {object} Object with excludes array and rules
 */
export function excludesProcess(s, o=null) {
  // If no previous rules and states, build rules based on user settings
  if ( !o || !o.rules || !Array.isArray(o.rules) ) {
    o = { rules: [] };
    if ( cfg('voice-exclude-italics') ) {
      o.rules.push( { separator: '*', open: false });
    }
    if ( cfg('voice-exclude-code') ) {
      o.rules.push( { separator: '```', open: false });
    }
  }

  // Excludes is an array of [start,end] index pairs
  o.excludes = [];

  // If there are rules, process them
  o.rules.forEach( x => {
    const parts = s.split(x.separator);
    let i = 0;
    parts.forEach( (y,j) => {
      const isLast = (j === (parts.length - 1));
      if ( x.open ) {
        const start = i - (j===0 ? 0 : x.separator.length);
        const end = i + y.length - 1 + (isLast ? x.separator.length : 0);
        o.excludes.push( [start, end] ); // Exclude
      }
      if ( !isLast ) {
        i += y.length + x.separator.length;
        x.open = !x.open;
      }
    });
  });

  return o;
}

/**
 * Handle avatar motion, gestures, and mood
 * @param {object} head - TalkingHead instance
 * @param {object} site - Site configuration
 */
export function motion(head, site, action, pose, gesture, mood) {
  try {
    head.setMood(mood || 'neutral');
  } catch(err) {}
  if ( gesture && site.gestures[gesture] ) {
    head.playGesture(site.gestures[gesture].name);
  }
}





