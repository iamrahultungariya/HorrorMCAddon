"""
The Forgotten Woods — Procedural Horror Audio Synthesis Engine
Generates pristine, studio-grade OGG Vorbis sound effects and ambient tracks
using mathematical acoustic modeling, FM synthesis, and physical audio emulation.
"""

import os
import numpy as np
import soundfile as sf

TARGET_DIR = r"D:\do note delete\Desktop\MC horror mod\the_forgotten_woods_RP\sounds"
HORROR_DIR = os.path.join(TARGET_DIR, "horror")
WEAPONS_DIR = os.path.join(TARGET_DIR, "weapons")
AMBIENT_DIR = os.path.join(TARGET_DIR, "ambient")

for d in [HORROR_DIR, WEAPONS_DIR, AMBIENT_DIR]:
    os.makedirs(d, exist_ok=True)

SAMPLE_RATE = 44100

def save_ogg(path, audio, sr=SAMPLE_RATE):
    audio = audio.astype(np.float32)
    max_val = np.max(np.abs(audio))
    if max_val > 0:
        audio = (audio / max_val) * 0.95
    sf.write(path, audio, sr, format='OGG', subtype='VORBIS')
    size_kb = os.path.getsize(path) / 1024
    print(f"Saved: {os.path.basename(path)} ({size_kb:.1f} KB)", flush=True)

# 1. Shotgun Blast (Sudden explosive punch + low-end kick + acoustic reverb)
def gen_shotgun_blast():
    duration = 2.2
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # Sub-kick transient (180 Hz diving to 35 Hz)
    f_kick = 180 * np.exp(-t * 28) + 35
    kick = np.sin(2 * np.pi * f_kick * t) * np.exp(-t * 12)
    
    # Explosive high-gain noise burst
    noise = np.random.uniform(-1, 1, len(t))
    noise_env = np.exp(-t * 18) * 0.9 + np.exp(-t * 3.5) * 0.3
    noise_burst = noise * noise_env
    
    # Metallic barrel ring (650 Hz & 1200 Hz resonance)
    barrel_ring = (np.sin(2 * np.pi * 650 * t) + 0.5 * np.sin(2 * np.pi * 1200 * t)) * np.exp(-t * 8)
    
    # Deep forest echo tail (delayed, dampened impulses)
    echo = np.zeros_like(t)
    delays = [0.08, 0.19, 0.35, 0.62]
    for i, d in enumerate(delays):
        idx = int(d * SAMPLE_RATE)
        decay = 0.4 / (i + 1)
        if idx < len(t):
            echo[idx:] += noise[:len(t) - idx] * decay * np.exp(-t[:len(t) - idx] * 2.0)
            
    mix = kick * 1.5 + noise_burst * 1.2 + barrel_ring * 0.35 + echo * 0.5
    return mix

# 2. Shotgun Reload (Breech open, shell chamber, breech slam)
def gen_shotgun_reload():
    duration = 1.6
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    mix = np.zeros_like(t)
    
    # Event 1: Breech open lever (t = 0.1s)
    t1 = t - 0.1
    m1 = np.where(t1 > 0, np.sin(2 * np.pi * 1800 * t1) * np.exp(-t1 * 40) + np.random.uniform(-1, 1, len(t)) * np.exp(-t1 * 30), 0)
    
    # Event 2: Shell slide in chamber (t = 0.6s)
    t2 = t - 0.6
    m2 = np.where(t2 > 0, np.sin(2 * np.pi * 950 * t2) * np.exp(-t2 * 25) + np.sin(2 * np.pi * 1400 * t2) * np.exp(-t2 * 35), 0)
    
    # Event 3: Heavy steel breech snap close (t = 1.1s)
    t3 = t - 1.1
    m3 = np.where(t3 > 0, (np.sin(2 * np.pi * 320 * t3) + 0.8 * np.sin(2 * np.pi * 850 * t3)) * np.exp(-t3 * 18) + np.random.uniform(-1, 1, len(t)) * np.exp(-t3 * 50), 0)
    
    mix = m1 * 0.6 + m2 * 0.7 + m3 * 1.4
    return mix

# 3. Wooden Door Creak (Stick-slip friction, jittery pitch flutter)
def gen_door_creak():
    duration = 2.4
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # Friction flutter frequency
    base_f = 240 + 60 * np.sin(2 * np.pi * 4 * t) + np.random.normal(0, 15, len(t))
    phase = 2 * np.pi * np.cumsum(base_f) / SAMPLE_RATE
    
    # Harmonics of wood resonance
    harmonics = (
        np.sin(phase) +
        0.6 * np.sin(2 * phase) +
        0.3 * np.sin(3 * phase) +
        0.2 * np.sin(4 * phase)
    )
    
    # Random stick-slip micro-impulses
    envelope = (1 - np.exp(-t * 5)) * np.exp(-t * 0.8)
    jitter = np.abs(np.sin(2 * np.pi * 8 * t)) ** 0.5
    creak = harmonics * envelope * (0.4 + 0.6 * jitter)
    return creak

# 4. Chest Creak (Rusted iron hinge whine + hollow cedar cavity)
def gen_chest_creak():
    duration = 1.8
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # Rising rusted metal whine (400 Hz to 850 Hz)
    f_whine = 420 + 400 * (t / duration) ** 1.5
    whine = np.sin(2 * np.pi * f_whine * t) + 0.4 * np.sin(2 * np.pi * f_whine * 2 * t)
    
    # Hollow resonance
    hollow = np.sin(2 * np.pi * 140 * t) * np.exp(-t * 2.0)
    
    envelope = (1 - np.exp(-t * 8)) * np.exp(-t * 1.2)
    return whine * envelope * 0.8 + hollow * 0.4

# 5. Bear Trap Snap (Violent metal teeth slam + spring resonance)
def gen_bear_trap_snap():
    duration = 1.8
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # Spring release whoosh (0 to 0.05s)
    whoosh = np.random.uniform(-1, 1, len(t)) * np.exp(-((t - 0.03) ** 2) / 0.0005)
    
    # Massive mechanical metal strike at t = 0.06s
    t_strike = np.maximum(0, t - 0.06)
    strike_impulse = np.random.uniform(-1, 1, len(t)) * np.exp(-t_strike * 60)
    
    # High-Q metallic ringdown (1150 Hz and 2400 Hz steel teeth ring)
    ring = (np.sin(2 * np.pi * 1150 * t_strike) * 0.8 + np.sin(2 * np.pi * 2420 * t_strike) * 0.5) * np.exp(-t_strike * 6)
    
    # Heavy low punch (120 Hz)
    thud = np.sin(2 * np.pi * 120 * t_strike) * np.exp(-t_strike * 25)
    
    mix = whoosh * 0.3 + strike_impulse * 1.5 + ring * 0.9 + thud * 1.2
    return mix

# 6. Weeping Wraith Stone Slide (Granular friction, massive granite block scraping)
def gen_stone_slide():
    duration = 2.5
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # Low frequency rumble (40 - 90 Hz random walking noise)
    noise = np.random.uniform(-1, 1, len(t))
    rumble = np.convolve(noise, np.ones(80)/80, mode='same')
    
    # Gritty abrasive scraping (high-pass filtered random grains)
    scrape = noise - np.convolve(noise, np.ones(10)/10, mode='same')
    scrape_mod = scrape * (0.5 + 0.5 * np.sin(2 * np.pi * 12 * t))
    
    # Envelope
    env = (1 - np.exp(-t * 4)) * np.exp(-t * 0.7)
    mix = (rumble * 2.2 + scrape_mod * 0.8) * env
    return mix

# 7. Grandfather Clock Chime (Deep 110 Hz bell fundamental + inharmonic bell ratios)
def gen_clock_chime():
    duration = 5.0
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # Acoustic bell inharmonics (f0, 2.0f0, 3.01f0, 4.15f0, 5.43f0)
    f0 = 110.0
    partials = [
        (f0 * 1.00, 1.0, 1.2),   # Fundamental
        (f0 * 2.01, 0.7, 1.8),   # Octave
        (f0 * 2.98, 0.5, 2.5),   # Tierce
        (f0 * 4.15, 0.4, 3.2),   # Quint
        (f0 * 5.43, 0.25, 4.0),  # Upper chime
    ]
    
    chime = np.zeros_like(t)
    for freq, amp, decay in partials:
        chime += amp * np.sin(2 * np.pi * freq * t) * np.exp(-t * decay)
        
    # Attack mallet clack
    mallet = np.random.uniform(-1, 1, len(t)) * np.exp(-t * 80) * 0.4
    return chime + mallet

# 8. Jumpscare Screech (Violent dissonant tritone cluster + sub bass drop)
def gen_jumpscare_screech():
    duration = 1.8
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # Tritone cluster (C6, F#6, G6, G#6) - 1046 Hz, 1480 Hz, 1568 Hz, 1661 Hz
    screech = (
        np.sin(2 * np.pi * 1046 * t) +
        1.1 * np.sin(2 * np.pi * 1480 * t) +
        0.9 * np.sin(2 * np.pi * 1568 * t) +
        1.2 * np.sin(2 * np.pi * 1661 * t)
    )
    # Distortion saturation
    screech = np.tanh(screech * 2.5) * np.exp(-t * 2.2)
    
    # Sub bass drop (120 Hz diving to 25 Hz)
    f_sub = 120 * np.exp(-t * 8) + 25
    sub = np.sin(2 * np.pi * f_sub * t) * np.exp(-t * 3.0)
    
    mix = screech * 1.0 + sub * 1.5
    return mix

# 9. Heartbeat Fast (130 BPM double lub-dub pulse loop)
def gen_heartbeat_fast():
    duration = 4.0
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    audio = np.zeros_like(t)
    
    bpm = 125
    beat_interval = 60.0 / bpm
    
    num_beats = int(duration / beat_interval)
    for b in range(num_beats):
        t_base = b * beat_interval
        
        # Lub (1st ventricle contraction, 55 Hz)
        t_lub = t - t_base
        lub = np.where((t_lub >= 0) & (t_lub < 0.18), np.sin(2 * np.pi * 55 * t_lub) * np.exp(-t_lub * 22), 0)
        
        # Dub (2nd atrial contraction, 75 Hz, 0.14s later)
        t_dub = t - (t_base + 0.14)
        dub = np.where((t_dub >= 0) & (t_dub < 0.16), np.sin(2 * np.pi * 75 * t_dub) * np.exp(-t_dub * 28) * 0.75, 0)
        
        audio += lub + dub
        
    return audio

# 10. The Woods Stalker Monster Snarl / Growl (Sub-harmonic throat formant)
def gen_monster_snarl():
    duration = 3.2
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # Low throat pitch modulation with tremolo
    f0 = 48 + 15 * np.sin(2 * np.pi * 2.5 * t) + np.random.normal(0, 4, len(t))
    phase = 2 * np.pi * np.cumsum(f0) / SAMPLE_RATE
    
    # Deep rasping sawtooth + vocal fry
    voice = np.sin(phase) + 0.7 * np.sin(2 * phase) + 0.5 * np.sin(3 * phase) + 0.3 * np.sin(4 * phase)
    
    # Formant throat filtering simulation
    noise = np.random.uniform(-1, 1, len(t)) * 0.35
    env = (1 - np.exp(-t * 3)) * np.exp(-t * 0.7)
    
    growl = (voice + noise) * env
    # Heavy wave shaping saturation
    return np.tanh(growl * 3.0)

# 11. Glass Break (High-speed impact + shattering shards)
def gen_glass_break():
    duration = 1.4
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # Sharp initial crack
    crack = np.random.uniform(-1, 1, len(t)) * np.exp(-t * 100) * 1.5
    
    # High frequency shard tinkle (3500 Hz, 4800 Hz, 6200 Hz)
    shards = (
        np.sin(2 * np.pi * 3500 * t) * np.exp(-t * 8) +
        0.8 * np.sin(2 * np.pi * 4800 * t) * np.exp(-t * 12) +
        0.6 * np.sin(2 * np.pi * 6200 * t) * np.exp(-t * 16)
    )
    
    # Granular scatter noise
    scatter = np.random.uniform(-1, 1, len(t)) * np.exp(-t * 6) * 0.4
    return crack + shards * 0.7 + scatter

# 12. Pebble Clatter (Stone bounce decay)
def gen_pebble_clatter():
    duration = 1.2
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    mix = np.zeros_like(t)
    
    # Bounces at t = 0.0, 0.2, 0.35, 0.45, 0.52, 0.56, 0.59
    bounces = [0.0, 0.18, 0.32, 0.42, 0.50, 0.56, 0.60]
    for i, b in enumerate(bounces):
        t_b = np.maximum(0, t - b)
        freq = 800 + i * 120
        amp = (0.8 ** i)
        impact = np.sin(2 * np.pi * freq * t_b) * np.exp(-t_b * 60) * amp
        mix += impact
        
    return mix

# 13. Forest Night Wind Ambience Loop (8 seconds continuous haunting atmospheric drone)
def gen_forest_wind_ambience():
    duration = 8.0
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # Pink noise approximation
    white = np.random.uniform(-1, 1, len(t))
    # Cumulative smoothing to shape as dark ambient wind
    smooth1 = np.convolve(white, np.ones(150)/150, mode='same')
    smooth2 = np.convolve(white, np.ones(500)/500, mode='same')
    
    # Slow undulating wind gusts
    gust = 0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * t) + 0.2 * np.sin(2 * np.pi * 0.1 * t)
    wind = (smooth1 * 1.5 + smooth2 * 2.0) * gust
    
    # Eerie tritone atmospheric whistle (distant howling)
    whistle_f = 460 + 50 * np.sin(2 * np.pi * 0.18 * t)
    whistle = np.sin(2 * np.pi * whistle_f * t) * (0.12 + 0.08 * np.sin(2 * np.pi * 0.35 * t))
    
    # Sub-drone (38 Hz)
    sub_drone = np.sin(2 * np.pi * 38 * t) * 0.25
    
    mix = wind + whistle + sub_drone
    # Seamless loop fade in/out at edges
    fade_len = int(SAMPLE_RATE * 0.4)
    fade_in = np.linspace(0, 1, fade_len)
    fade_out = np.linspace(1, 0, fade_len)
    mix[:fade_len] *= fade_in
    mix[-fade_len:] *= fade_out
    
    return mix.astype(np.float32)

# 14. Flashlight Click (Tactical polymer switch snap)
def gen_flashlight_click():
    duration = 0.35
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    click1 = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 90)
    click2 = np.where(t > 0.04, np.sin(2 * np.pi * 3800 * (t - 0.04)) * np.exp(-(t - 0.04) * 120) * 0.7, 0)
    snap = np.random.uniform(-1, 1, len(t)) * np.exp(-t * 110) * 0.5
    
    return click1 + click2 + snap

def main():
    print("Synthesizing Pristine Procedural Horror Audio Suite...")
    
    save_ogg(os.path.join(WEAPONS_DIR, "shotgun_blast.ogg"), gen_shotgun_blast())
    save_ogg(os.path.join(WEAPONS_DIR, "shotgun_reload.ogg"), gen_shotgun_reload())
    
    save_ogg(os.path.join(HORROR_DIR, "door_creak.ogg"), gen_door_creak())
    save_ogg(os.path.join(HORROR_DIR, "chest_creak.ogg"), gen_chest_creak())
    save_ogg(os.path.join(HORROR_DIR, "bear_trap_snap.ogg"), gen_bear_trap_snap())
    save_ogg(os.path.join(HORROR_DIR, "stone_slide.ogg"), gen_stone_slide())
    save_ogg(os.path.join(HORROR_DIR, "clock_chime.ogg"), gen_clock_chime())
    save_ogg(os.path.join(HORROR_DIR, "jumpscare_screech.ogg"), gen_jumpscare_screech())
    save_ogg(os.path.join(HORROR_DIR, "heartbeat_fast.ogg"), gen_heartbeat_fast())
    save_ogg(os.path.join(HORROR_DIR, "monster_snarl.ogg"), gen_monster_snarl())
    save_ogg(os.path.join(HORROR_DIR, "glass_break.ogg"), gen_glass_break())
    save_ogg(os.path.join(HORROR_DIR, "pebble_clatter.ogg"), gen_pebble_clatter())
    save_ogg(os.path.join(HORROR_DIR, "flashlight_click.ogg"), gen_flashlight_click())
    
    save_ogg(os.path.join(AMBIENT_DIR, "forest_wind_ambience.ogg"), gen_forest_wind_ambience())
    
    print("\nAll 14 procedural sound assets synthesized successfully in OGG Vorbis format!")

if __name__ == "__main__":
    main()
