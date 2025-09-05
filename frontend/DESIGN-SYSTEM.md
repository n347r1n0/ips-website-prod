# IPS Design System - Complete Hierarchy

## 🎨 Color Palette
- **Primary Ocean**: #007193 → #00A29C (gradients)
- **Gold Accent**: #D4AF37 (highlights, secondary actions)
- **Deep Teal**: #38a3ab (success states)
- **IPS Red**: #ee2346 (danger, destructive actions) 
- **Dark Neutral**: #2c2c30 → #3c3c40 (utility buttons)

## 📐 Container Hierarchy

### 🏔️ LARGE CONTAINERS → Opaque Neumorphic
**Size**: Full-screen modals, large content panels (tournament day panels with 2+ items)
**Style**: `neumorphic-container` 
**Background**: Solid #2a2a2e with inset shadows
**Examples**: 
- ModalBase (full-screen)
- TournamentListForDay panel (has multiple tournaments)
- Large rating tables

### 🪟 MEDIUM CONTAINERS → Glassmorphic  
**Size**: Individual cards, auth panels, single items
**Style**: `glassmorphic-panel`
**Background**: Semi-transparent with backdrop blur
**Examples**:
- Tournament cards (individual)
- AuthModal panels
- Player cards
- Registration forms

### 🔘 ALL BUTTONS → Claymorphic with Color System
**Font**: Syne, semibold, uppercase
**Shadows**: 4-6px depth with proper press feedback
**Colors**:
- **Primary** (Ocean): Main actions - register, confirm
- **Secondary** (Gold): Important secondary actions 
- **Danger** (Red): Cancel, delete, destructive
- **Neutral** (Gray): Close, back, utility

## 📱 Button Specifications

### Sizes & Padding
- **Small**: 36px min-height, 0.5rem 1rem padding
- **Medium**: 44px min-height, 0.75rem 1.5rem padding  
- **Large**: 52px min-height, 1rem 2rem padding

### Interactions
- **Hover**: -1px to -2px translateY
- **Active**: +1px to +3px translateY
- **Shadows**: Deeper on hover, shallow on press

## 🗂️ Component Mapping

### Tournament System
- **TournamentListForDay**: LARGE → neumorphic-container
- **Individual tournament cards**: MEDIUM → glassmorphic-panel
- **Register buttons**: PRIMARY ocean claymorphic
- **Results buttons**: SECONDARY gold claymorphic
- **Cancel buttons**: DANGER red claymorphic

### Player System  
- **FullRatingModal**: LARGE → neumorphic-container
- **Individual player cards**: MEDIUM → glassmorphic-panel
- **PlayerModal**: MEDIUM → glassmorphic-panel (not large - single player)

### Auth System
- **AuthModal**: MEDIUM → glassmorphic-panel
- **Login buttons**: PRIMARY ocean claymorphic
- **Close buttons**: NEUTRAL gray claymorphic

### Navigation
- **Close buttons**: NEUTRAL gray claymorphic
- **Confirm buttons**: PRIMARY ocean claymorphic  
- **Cancel buttons**: DANGER red claymorphic

## 🚫 What NOT to Use
- No transparent/ghost buttons
- No gray primary buttons  
- No glassmorphic buttons
- No neumorphic medium containers