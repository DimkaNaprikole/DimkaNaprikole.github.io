import { LANGUAGE_CATALOG } from './languages.js';

(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  function displayName(locale, code, fallback) {
    try {
      const name = new Intl.DisplayNames([locale], {type: 'language'}).of(code);
      return name && name !== code ? name : fallback;
    }
    catch { return fallback; }
  }
  function normalizeLanguage(value) {
    const code = String(value || '').toLowerCase().split(/[-_]/)[0];
    return code === 'no' ? 'nb' : code === 'jw' ? 'jv' : code;
  }
  function searchKey(value) {
    return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
  const languages = LANGUAGE_CATALOG.map((language) => {
    const russianFallback = {ba: 'башкирский', bo: 'тибетский'};
    const name = russianFallback[language.code] || displayName('ru', language.code, language.name);
    const nativeName = displayName(language.code, language.code, language.name);
    return {...language, name, nativeName,
      search: searchKey(`${name} ${nativeName} ${language.name} ${language.code}`)};
  });
  const names = Object.fromEntries(languages.map(({code, name}) => [code, name]));
  const languageByCode = new Map(languages.map((language) => [language.code, language]));
  const quickCodes = ['nb', 'en', 'uk', 'ru', 'de'];
  let selectedLanguage = 'ru';
  function updateLanguageHint() {
    $('languageHint').textContent = languageByCode.get(selectedLanguage)?.ttsListed
      ? 'Язык указан в списке озвучки OpenAI. Качество в нашем приложении ещё не проверено.'
      : 'Экспериментальный язык: распознавание и озвучку ещё нужно проверить.';
  }
  function renderLanguageOptions() {
    const query = searchKey($('languageSearch').value);
    const matches = languages.filter((language) => language.search.includes(query));
    const visible = new Set(matches.map(({code}) => code));
    // Filtering must never silently change the selected language.
    visible.add(selectedLanguage);
    const select = $('language');
    select.replaceChildren();
    const addGroup = (label, entries) => {
      if (!entries.length) return;
      const group = document.createElement('optgroup'); group.label = label;
      for (const language of entries) {
        const option = document.createElement('option'); option.value = language.code;
        option.textContent = language.name === language.nativeName
          ? `${language.name} · ${language.code}` : `${language.name} — ${language.nativeName} · ${language.code}`;
        group.appendChild(option);
      }
      select.appendChild(group);
    };
    addGroup('Быстрый выбор', quickCodes.filter((code) => visible.has(code)).map((code) => languageByCode.get(code)).filter(Boolean));
    addGroup('Все языки', languages.filter(({code}) => visible.has(code) && !quickCodes.includes(code))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru')));
    select.value = selectedLanguage;
    $('languageSearchStatus').textContent = query
      ? (matches.length ? `Найдено языков: ${matches.length}.` : 'Совпадений нет.')
        + (matches.some(({code}) => code === selectedLanguage) ? '' : ' Выбранный язык сохранён в списке.')
      : `В каталоге ${languages.length} языков. Выберите язык своей речи.`;
    updateLanguageHint();
  }
  const errorMessages = {
    ROOM_PILOT_DENIED: 'Нет доступа к этой пробе или выбран другой язык. Проверьте тестовую ссылку.',
    ROOM_PILOT_EXPIRED: 'Время тестового доступа истекло. Новых запросов не отправлено.',
    ROOM_PILOT_EXHAUSTED: 'Ваша тестовая реплика уже использована. Новая платная попытка не запущена.',
    ROOM_PILOT_DUPLICATE: 'Эта тестовая реплика уже учтена.',
    ROOM_PILOT_INVALID: 'Журнал тестового доступа недоступен. Платный запрос не запущен.',
    ROOM_PILOT_LOCKED: 'Журнал тестового доступа занят. Автоматического повтора не будет.',
    ROOM_PILOT_UNAVAILABLE: 'Не удалось сохранить допуск. Платный запрос не запущен.',
    PILOT_PHRASE_TOO_LONG: 'Для этой пробы запишите фразу не длиннее 10 секунд.',
    UNSUPPORTED_PAIR: 'У участников должны быть выбраны разные поддерживаемые языки.',
    UNSUPPORTED_LANGUAGE: 'Выберите язык из списка.',
    ROOM_FULL: 'В комнате уже два участника. Создайте новую комнату для другого разговора.',
    INVALID_INVITE: 'Приглашение недействительно. Попросите собеседника прислать новую ссылку.',
    ROOM_NOT_FOUND: 'Комната не найдена или уже закрыта. Попросите новую ссылку.',
    INVALID_MEMBER_TOKEN: 'Место в комнате больше недоступно. Попросите новое приглашение.',
    ROOM_EXPIRED: 'Время комнаты истекло. Создайте новую комнату.',
    SPEECH_UNAVAILABLE: 'Голосовой перевод пока не включён на сервере. Комната работает только для проверки подключения.',
    TIMEOUT: 'Перевод не успел завершиться. Повторная отправка автоматически не выполняется.',
    RATE_LIMITED: 'Слишком много запросов. Подождите немного перед следующей фразой.',
    LANGUAGE_MISMATCH: 'Язык речи не совпал с выбранным. Говорите на своём языке или создайте комнату с нужными языками.',
    PEER_DISCONNECTED: 'Собеседник отключился. Фраза не доставлена.',
    NOT_READY: 'Дождитесь подключения собеседника перед записью фразы.',
    BUSY: 'Сейчас переводится другая фраза. Дождитесь окончания.',
    INVALID_AUDIO: 'Не удалось принять запись. Попробуйте записать фразу ещё раз, до 20 секунд.',
    TRANSLATION_FAILED: 'Не удалось перевести фразу. Автоматической повторной отправки не будет.',
    CAPACITY: 'Сейчас все комнаты заняты. Подключитесь немного позже.',
    JOIN_TIMEOUT: 'Время подключения истекло. Подключитесь заново.',
    INVALID_MESSAGE: 'Не удалось обработать команду. Подключитесь к комнате заново.',
    DUPLICATE_REQUEST: 'Эта фраза уже отправлена. Дождитесь результата.',
  };
  const limits = {rate: 16000, seconds: 20, samples: 320000};
  const demoMode = new URLSearchParams(location.search).get('demo') === '1';
  if (demoMode) document.documentElement.classList.add('demo');
  const demoParentOrigin = 'https://translate.45.88.201.146.sslip.io';
  function demoEvent(event, details = {}) {
    if (demoMode && window.parent && window.parent !== window) {
      window.parent.postMessage({type:'translator-demo-event',event,...details}, demoParentOrigin);
    }
  }
  const fragment = new URLSearchParams(location.hash.slice(1));
  const pilotToken = fragment.get('pilot');
  const preset = normalizeLanguage(fragment.get('lang'));
  selectedLanguage = languageByCode.has(preset) ? preset : 'ru';
  let peerLanguage = normalizeLanguage(fragment.get('peer')) || 'nb';
  const voiceProfiles = new Set(['auto','soft','low']);
  let selectedVoiceProfile = 'auto';
  const voiceLabels = {marin:'Мягкий голос',cedar:'Низкий голос'};
  if (!languageByCode.has(peerLanguage) || peerLanguage === selectedLanguage) peerLanguage = selectedLanguage === 'ru' ? 'nb' : 'ru';
  if (pilotToken) { selectedLanguage = 'ru'; peerLanguage = 'nb'; }
  const incoming = {roomId: fragment.get('room'), inviteToken: fragment.get('invite')};
  const invalidInvite = !!incoming.roomId !== !!incoming.inviteToken;
  let socket, connectionTimer, room, ready = false, speechReady = false, busy = false;
  let connecting = false, awaiting = false, pendingRequestId, paused = false, capturePending = false, playbackPending = false;
  let trial = false, trialRemainingTurns = 0, autoLanguage = false;
  let epoch = 0, recorder, context, playback, lastAudio, recordingTimer, timerInterval;
  let active = false, restartTimer;
  const resumeKey = demoMode ? 'translator-room-seat-demo-v1' : 'translator-room-seat-v1';
  const resumeGraceMs = 120000;
  let reservation, reconnectTimer, reconnectDeadline = 0, reconnectAttempt = 0, suspended = false;
  function saveReservation() {
    if (!reservation) return;
    try { sessionStorage.setItem(resumeKey, JSON.stringify(reservation)); } catch {}
  }
  function clearReservation() {
    reservation = null; reconnectDeadline = 0; reconnectAttempt = 0;
    clearTimeout(reconnectTimer);
    try { sessionStorage.removeItem(resumeKey); } catch {}
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(resumeKey) || 'null');
    if (saved && /^[a-zA-Z0-9_-]{8,128}$/.test(saved.roomId || '') && /^[a-zA-Z0-9_-]{16,128}$/.test(saved.memberToken || '')
      && languageByCode.has(saved.language) && languageByCode.has(saved.peerLanguage)
      && Number.isFinite(saved.expiresAt) && saved.expiresAt > Date.now() && saved.expiresAt <= Date.now() + resumeGraceMs
      && (!incoming.roomId || incoming.roomId === saved.roomId)) {
      reservation = {roomId:saved.roomId, memberToken:saved.memberToken, language:saved.language,
        peerLanguage:saved.peerLanguage, voiceProfile:voiceProfiles.has(saved.voiceProfile) ? saved.voiceProfile : 'auto', expiresAt:saved.expiresAt};
      selectedLanguage = saved.language; peerLanguage = saved.peerLanguage;
      selectedVoiceProfile = reservation.voiceProfile;
    } else if (saved) { sessionStorage.removeItem(resumeKey); }
  } catch {}

  function error(message = '') { $('error').textContent = message.slice(0, 500); $('error').hidden = !message; }
  function status(message, style = '') { $('status').textContent = message; $('statusDot').className = `dot ${style}`; }
  function canSpeak() { return !!room && socket?.readyState === WebSocket.OPEN && ready && speechReady && !busy && !awaiting && !playback && !playbackPending && !capturePending; }
  function render() {
    $('connect').disabled = connecting || invalidInvite;
    $('connect').textContent = reservation ? 'Вернуться в разговор' : 'Начать разговор';
    $('language').disabled = connecting;
    $('languageSearch').disabled = connecting;
    $('peerLanguage').disabled = connecting;
    $('voiceProfile').disabled = connecting;
    $('record').hidden = active && !paused;
    const connected = socket?.readyState === WebSocket.OPEN;
    $('record').disabled = !room || connecting || (connected && !speechReady);
    $('record').textContent = connected ? 'Продолжить разговор' : 'Восстановить соединение';
    $('pause').disabled = !(active || recorder || capturePending || playback || playbackPending || awaiting);
    $('repeat').hidden = !lastAudio || !!recorder || capturePending;
    $('repeat').disabled = !!playback || playbackPending || awaiting || busy;
    demoEvent('availability', {speakable:canSpeak()});
    if (!room) {
      if (demoMode && lastAudio) status(playback || playbackPending ? 'Звучит полученный перевод' : 'Проба завершена · запись можно прослушать', playback || playbackPending ? 'active' : '');
      return;
    }
    if (!connected) {
      status(connecting ? 'Восстанавливаю соединение…' : 'Связь прервана · микрофон выключен');
      $('help').textContent = 'Комната сохранена на две минуты. После возврата нажмите «Восстановить соединение». Фраза автоматически не повторяется.';
      if (demoMode) $('help').textContent = 'Тестовая запись · микрофон выключен. ' + $('help').textContent;
      return;
    }
    if (recorder) status(recorder.hasSpeech ? 'Слушаю фразу…' : 'Говорите — я слушаю', 'recording');
    else if (capturePending) status('Подключаю микрофон…');
    else if (playback || playbackPending) status('Звучит перевод', 'active');
    else if (awaiting) status('Перевожу фразу…', 'active');
    else if (trial && !speechReady) status(trialRemainingTurns ? 'Теперь очередь собеседника' : 'Проба завершена или время истекло');
    else if (!speechReady) status('Голосовая проба закрыта · микрофон выключен');
    else if (!ready) status('Ждём собеседника');
    else if (busy) status('Переводится фраза собеседника…', 'active');
    else if (paused) status('На паузе');
    else status('Можно говорить', 'active');
    $('help').textContent = !speechReady
      && trial ? 'В пробе доступна одна короткая реплика с каждого телефона. Дополнительных платных попыток нет.' : !speechReady
      ? 'Платная голосовая проба сейчас закрыта. Микрофон не включён. Соединение комнаты можно проверить бесплатно.'
      : !ready ? 'Отправьте приглашение на второй телефон. Язык собеседника уже выбран.'
      : 'Говорите по очереди. После короткой паузы фраза отправится сама. «Пауза» выключает микрофон.';
    if (autoLanguage && speechReady) $('help').textContent += ' Язык речи определится автоматически среди двух языков разговора.';
    if (demoMode) $('help').textContent = 'Тестовая запись · микрофон выключен. ' + $('help').textContent;
  }
  function send(message) {
    if (socket?.readyState !== WebSocket.OPEN) throw new Error('Связь с комнатой потеряна. Подключитесь заново.');
    socket.send(JSON.stringify(message));
  }
  function bytesToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  }
  function base64ToBytes(data) {
    if (typeof data !== 'string' || data.length > 4000000) throw new Error('Неподдерживаемый размер озвучки.');
    const binary = atob(data);
    return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  }
  async function unlockAudio(token = epoch) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Этот браузер не поддерживает запись. Откройте ссылку в современном браузере.');
    context ||= new AudioContext();
    const current = context;
    await current.resume();
    if (token !== epoch || context !== current) return;
    // Unlock output during a direct tap, including Safari on phones.
    const source = current.createBufferSource();
    source.buffer = current.createBuffer(1, 1, current.sampleRate);
    source.connect(current.destination);
    source.start();
  }
  function stopPlayback() {
    if (playback) { playback.onended = null; try { playback.stop(); } catch {} playback.disconnect(); playback = null; }
  }
  async function playAudio(audio, token = epoch, allowPaused = false) {
    if (!audio || audio.encoding !== 'wav') throw new Error('Сервер вернул неподдерживаемую озвучку.');
    playbackPending = true; render();
    let buffer;
    try {
      await unlockAudio();
      if (token !== epoch || (!room && !demoMode) || (paused && !allowPaused)) return;
      buffer = await context.decodeAudioData(base64ToBytes(audio.data).buffer);
    } finally { if (token === epoch) playbackPending = false; }
    if (token !== epoch || (!room && !demoMode) || (paused && !allowPaused)) return;
    if (context.state !== 'running') throw new Error('Нажмите «Прослушать перевод», чтобы включить звук.');
    stopPlayback();
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    playback = source;
    source.onended = () => { if (playback === source) { playback = null; source.disconnect(); render(); scheduleListening(350); } };
    source.start();
    render();
  }
  function discardRecording() {
    clearTimeout(recordingTimer); clearInterval(timerInterval);
    const current = recorder;
    recorder = null;
    if (current) {
      current.processor.onaudioprocess = null;
      current.processor.disconnect(); current.input.disconnect(); current.silence.disconnect();
      current.stream.getTracks().forEach((track) => track.stop());
    }
    $('timer').textContent = `Одна фраза — до ${limits.seconds} секунд`;
    return current;
  }
  function resample(chunks, inputRate) {
    const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const samples = new Float32Array(length);
    let offset = 0;
    for (const chunk of chunks) { samples.set(chunk, offset); offset += chunk.length; }
    const count = Math.min(limits.samples, Math.floor(length * limits.rate / inputRate));
    const result = new Uint8Array(count * 2);
    const view = new DataView(result.buffer);
    // Average each output interval, also reducing aliasing during downsampling.
    for (let i = 0; i < count; i++) {
      const start = Math.floor(i * inputRate / limits.rate);
      const end = Math.min(length, Math.max(start + 1, Math.floor((i + 1) * inputRate / limits.rate)));
      let sum = 0;
      for (let j = start; j < end; j++) sum += samples[j];
      const value = Math.max(-1, Math.min(1, sum / (end - start)));
      view.setInt16(i * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true);
    }
    return result;
  }
  function finishRecording() {
    const current = discardRecording();
    if (!current) return;
    if (!current.hasSpeech || current.voicedSamples < current.rate * 0.15) { render(); scheduleListening(); return; }
    if (!canSpeak()) { error('Состояние комнаты изменилось. Фраза не отправлена.'); render(); return; }
    const bytes = resample(current.chunks, current.rate);
    if (bytes.length < 3200) { render(); scheduleListening(); return; }
    const requestId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      awaiting = true; pendingRequestId = requestId;
      send({type: 'audio', requestId, audio: {encoding: 'pcm16', sampleRate: limits.rate, channels: 1, data: bytesToBase64(bytes)}});
    } catch (cause) { awaiting = false; pendingRequestId = null; pause(); error(cause.message); }
    render();
  }
  function scheduleListening(delay = 100) {
    clearTimeout(restartTimer);
    if (demoMode) return;
    if (!active || paused || document.hidden || recorder || !canSpeak()) return;
    const token = epoch;
    restartTimer = setTimeout(() => { if (token === epoch && active && !paused) void startRecording(); }, delay);
  }
  async function startRecording() {
    if (demoMode) return;
    if (!active || paused || recorder || !canSpeak()) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) { pause(); error('Для микрофона откройте HTTPS-ссылку в Safari или Chrome.'); return; }
    capturePending = true;
    const token = epoch;
    render();
    let stream;
    try {
      await unlockAudio();
      if (token !== epoch || !active || paused || document.hidden) return;
      stream = await navigator.mediaDevices.getUserMedia({audio: {channelCount: 1, echoCancellation: true, noiseSuppression: true}, video: false});
      if (token !== epoch) { stream.getTracks().forEach((track) => track.stop()); return; }
      capturePending = false;
      if (!active || paused || !canSpeak() || document.hidden) { stream.getTracks().forEach((track) => track.stop()); render(); return; }
      const input = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const silence = context.createGain(); silence.gain.value = 0;
      const current = {stream, input, processor, silence, chunks: [], preRoll: [], rate: context.sampleRate,
        count: 0, hasSpeech: false, voicedSamples: 0, silentSamples: 0};
      recorder = current;
      processor.onaudioprocess = (event) => {
        if (recorder !== current || !active || paused) return;
        const raw = event.inputBuffer.getChannelData(0);
        let energy = 0;
        for (const value of raw) energy += value * value;
        const voiced = Math.sqrt(energy / raw.length) >= 0.018;
        if (!current.hasSpeech) {
          if (!voiced) { current.preRoll.push(raw.slice()); if (current.preRoll.length > 2) current.preRoll.shift(); return; }
          current.hasSpeech = true;
          current.chunks = current.preRoll; current.preRoll = [];
          current.count = current.chunks.reduce((n, chunk) => n + chunk.length, 0);
          recordingTimer = setTimeout(finishRecording, limits.seconds * 1000);
          render();
        }
        const remaining = Math.max(0, Math.ceil(limits.seconds * current.rate) - current.count);
        const chunk = raw.slice(0, remaining);
        current.chunks.push(chunk); current.count += chunk.length;
        if (voiced) { current.voicedSamples += chunk.length; current.silentSamples = 0; }
        else current.silentSamples += chunk.length;
        $('timer').textContent = `Фраза: ${Math.min(limits.seconds, Math.floor(current.count / current.rate))} / ${limits.seconds} с · отправка после паузы`;
        if (current.count >= limits.seconds * current.rate || current.silentSamples >= current.rate * 0.8) finishRecording();
      };
      input.connect(processor); processor.connect(silence); silence.connect(context.destination);
      render();
    } catch (cause) {
      stream?.getTracks().forEach((track) => track.stop());
      if (token !== epoch) return;
      pause();
      error(cause.name === 'NotAllowedError' ? 'Разрешите микрофон в настройках браузера и нажмите «Продолжить разговор».' : 'Не удалось включить микрофон. Проверьте устройство и нажмите «Продолжить разговор».');
    }
  }
  function activate() {
    error(); active = true; paused = false;
    const token = epoch;
    // Prime output in the tap. Capture starts only after the server allows speech.
    void unlockAudio().catch(() => { if (token === epoch) { pause(); error('Не удалось включить звук. Откройте ссылку в Safari или Chrome.'); } });
    render(); scheduleListening();
  }
  function pause() {
    ++epoch; active = false; paused = true; capturePending = false; playbackPending = false;
    clearTimeout(restartTimer);
    if (awaiting && pendingRequestId && socket?.readyState === WebSocket.OPEN) {
      try { send({type: 'cancel', requestId: pendingRequestId}); } catch {}
    }
    awaiting = false; pendingRequestId = null;
    discardRecording(); stopPlayback(); render();
  }
  function showTranscript(message) {
    for (const [id, value] of [['sourceText', message.sourceText], ['translatedText', message.translatedText]]) {
      if (typeof value === 'string') { $(id).textContent = value.slice(0, 12000); $(id).classList.remove('placeholder'); }
    }
    $('sourceTitle').textContent = `Оригинал · ${names[message.sourceLanguage] || 'речь'}`;
    $('translationTitle').textContent = `Перевод · ${names[message.targetLanguage] || 'текст'}`;
    const voiceLabel = typeof message.selectedVoice === 'string' && Object.hasOwn(voiceLabels, message.selectedVoice) ? voiceLabels[message.selectedVoice] : '';
    $('voiceBadge').textContent = voiceLabel;
    $('voiceBadge').hidden = !voiceLabel;
  }
  function demoTextEvent(event, message) {
    demoEvent(event, {
      sourceLanguage:languageByCode.has(message.sourceLanguage) ? message.sourceLanguage : '',
      targetLanguage:languageByCode.has(message.targetLanguage) ? message.targetLanguage : '',
      sourceText:typeof message.sourceText === 'string' ? message.sourceText.slice(0,12000) : '',
      translatedText:typeof message.translatedText === 'string' ? message.translatedText.slice(0,12000) : '',
      ...(typeof message.selectedVoice === 'string' && Object.hasOwn(voiceLabels,message.selectedVoice) ? {selectedVoice:message.selectedVoice} : {}),
    });
  }
  function replayLastAudio() {
    if (!lastAudio || playback || playbackPending || awaiting || busy) {
      demoEvent('error', {code:'DEMO_REPLAY_UNAVAILABLE'}); return;
    }
    ++epoch; clearTimeout(restartTimer); discardRecording(); error();
    const token = epoch;
    void playAudio(lastAudio, token, true).catch(() => {
      if (token === epoch) { pause(); error('Не удалось воспроизвести перевод. Проверьте громкость и разрешение звука.'); render(); }
    });
  }
  function cleanup() {
    pause(); clearTimeout(connectionTimer); clearTimeout(reconnectTimer);
    const current = socket; socket = null;
    if (current) { current.onclose = null; current.onerror = null; current.onmessage = null; current.close(); }
    room = null; ready = false; speechReady = false; busy = false; awaiting = false; connecting = false;
    if (!demoMode) lastAudio = null;
    if (context && !(demoMode && lastAudio)) { void context.close().catch(() => {}); context = null; }
  }
  function leave(message = '') {
    const keepDemoEvidence = demoMode && (lastAudio || !$('translatedText').classList.contains('placeholder'));
    cleanup(); clearReservation();
    if (keepDemoEvidence) {
      $('setup').hidden = true; $('conversation').hidden = false; $('inviteLink').value = '';
      render(); status('Проба завершена · результат сохранён на экране');
      $('help').textContent = lastAudio
        ? 'Тестовая запись · микрофон выключен. Полученный голос можно прослушать повторно бесплатно; после закрытия страницы запись исчезнет.'
        : 'Тестовая запись · микрофон выключен. Текст результата остаётся на экране до закрытия страницы.';
      error(message); return;
    }
    $('setup').hidden = false; $('conversation').hidden = true;
    $('setupTitle').textContent = incoming.roomId ? 'Присоединиться к разговору' : 'Начнём разговор';
    $('setupHint').textContent = incoming.roomId
      ? 'Ваш язык уже выбран в приглашении. Нажмите один раз и разрешите микрофон.'
      : 'Отправьте собеседнику приглашение из комнаты. Его язык уже будет выбран.';
    $('inviteLink').value = '';
    $('voiceBadge').hidden = true; $('voiceBadge').textContent = '';
    $('sourceText').textContent = 'Здесь появится произнесённая фраза'; $('sourceText').classList.add('placeholder');
    $('translatedText').textContent = 'Здесь появится перевод'; $('translatedText').classList.add('placeholder');
    render(); error(message);
  }
  function dropSocket() {
    clearTimeout(connectionTimer);
    const current = socket; socket = null; connecting = false;
    if (current) { current.onopen = null; current.onclose = null; current.onerror = null; current.onmessage = null; current.close(); }
  }
  function retryConnection() {
    clearTimeout(reconnectTimer);
    if (!reservation || suspended || document.hidden) return;
    const remaining = reconnectDeadline - Date.now();
    if (remaining <= 0) { leave('Время возврата в комнату истекло. Попросите новое приглашение или создайте новую комнату.'); return; }
    const delay = Math.min(remaining, Math.min(8000, 500 * 2 ** Math.min(reconnectAttempt++, 4)));
    reconnectTimer = setTimeout(() => {
      if (Date.now() >= reconnectDeadline) { leave('Время возврата в комнату истекло. Попросите новое приглашение.'); return; }
      connect(true);
    }, delay);
  }
  function disconnected() {
    pause(); dropSocket(); ready = false; speechReady = false; busy = false;
    if (!reservation) { leave('Не удалось подключиться. Проверьте интернет и повторите подключение.'); return; }
    if (!reconnectDeadline) reconnectDeadline = Date.now() + resumeGraceMs;
    reservation.expiresAt = reconnectDeadline; saveReservation();
    error('Связь прервалась. Восстанавливаю ту же комнату; микрофон выключен, фраза не повторяется.');
    render(); retryConnection();
  }
  function connect(automatic = false) {
    if (connecting || socket?.readyState === WebSocket.OPEN || invalidInvite) return;
    if (reservation && reservation.expiresAt <= Date.now()) { leave('Время возврата в комнату истекло. Попросите новое приглашение.'); return; }
    clearTimeout(reconnectTimer); suspended = false;
    error(); connecting = true;
    const resuming = !!reservation;
    if (resuming) {
      pause(); reconnectDeadline ||= reservation.expiresAt;
      if (!automatic) {
        const token = epoch;
        // A restored page also needs its first output unlock in the direct tap.
        void unlockAudio().catch(() => {
          if (token === epoch) error('Не удалось включить звук. После подключения нажмите «Продолжить разговор».');
        });
      }
    }
    else activate();
    render();
    let current;
    try { current = new WebSocket('wss://translate.45.88.201.146.sslip.io/v1/rooms'); }
    catch { disconnected(); return; }
    socket = current;
    connectionTimer = setTimeout(() => { if (socket === current && connecting) disconnected(); }, Math.min(10000, resuming ? Math.max(1, reconnectDeadline - Date.now()) : 10000));
    current.onopen = () => {
      if (socket !== current) return;
      const language = $('language').value;
      send(resuming ? {type:'resume',roomId:reservation.roomId,memberToken:reservation.memberToken}
        : incoming.roomId && incoming.inviteToken ? {type: 'join', ...incoming, language, voiceProfile:selectedVoiceProfile}
        : {type: 'create', language, autoLanguage:true, voiceProfile:selectedVoiceProfile, ...(pilotToken ? {pilotToken} : {})});
    };
    current.onmessage = (event) => {
      if (socket !== current || typeof event.data !== 'string' || event.data.length > 4500000) return;
      let message;
      try { message = JSON.parse(event.data); } catch { leave('Сервер вернул неверный ответ.'); return; }
      if (!message || typeof message !== 'object' || Array.isArray(message)) { leave('Сервер вернул неверный ответ.'); return; }
      if (message.type === 'joined') {
        if (typeof message.roomId !== 'string' || typeof message.inviteToken !== 'string') { leave('Сервер не создал ссылку комнаты.'); return; }
        clearTimeout(connectionTimer); connecting = false; room = message;
        reconnectDeadline = 0; reconnectAttempt = 0;
        if (typeof message.memberToken === 'string') {
          if (voiceProfiles.has(message.voiceProfile)) {
            selectedVoiceProfile = message.voiceProfile; $('voiceProfile').value = selectedVoiceProfile;
          }
          reservation = {roomId:message.roomId,memberToken:message.memberToken,language:message.language,
            peerLanguage,voiceProfile:selectedVoiceProfile,expiresAt:Date.now()+resumeGraceMs}; saveReservation();
        }
        if (resuming) {
          pause();
          error(automatic ? 'Соединение восстановлено. Чтобы снова включить микрофон, нажмите «Продолжить разговор».' : 'Вы вернулись в комнату.');
          if (!automatic) activate();
        }
        $('setup').hidden = true; $('conversation').hidden = false;
        const invite = new URL(location.href); invite.hash = new URLSearchParams({room: message.roomId, invite: message.inviteToken, lang: peerLanguage, peer: selectedLanguage}).toString();
        $('inviteLink').value = invite.href;
        $('languages').textContent = `Ваш язык: ${names[message.language] || names[$('language').value]}`;
        demoEvent('joined', {roomId:message.roomId,inviteToken:message.inviteToken,language:message.language});
      } else if (message.type === 'state') {
        trial = message.trial === true;
        autoLanguage = message.autoLanguage === true;
        if (voiceProfiles.has(message.voiceProfile)) {
          selectedVoiceProfile = message.voiceProfile; $('voiceProfile').value = selectedVoiceProfile;
          if (reservation) reservation.voiceProfile = selectedVoiceProfile;
        }
        trialRemainingTurns = message.trialRemainingTurns ?? 0;
        limits.seconds = trial ? 10 : 20; limits.samples = limits.seconds * limits.rate;
        if (!recorder) $('timer').textContent = `Одна фраза — до ${limits.seconds} секунд`;
        ready = message.ready === true; speechReady = message.speechReady === true; busy = message.busy === true;
        if (reservation) { reservation.expiresAt = Date.now() + resumeGraceMs; saveReservation(); }
        if (!ready || !speechReady || busy) {
          if (recorder || capturePending) { ++epoch; capturePending = false; discardRecording(); }
          clearTimeout(restartTimer);
        }
        $('languages').textContent = `Ваш язык: ${names[room?.language] || names[$('language').value]}${names[message.peerLanguage] ? ` · Собеседник: ${names[message.peerLanguage]}` : ''}`;
        demoEvent('state', {ready,speechReady,busy,remaining:trialRemainingTurns,trialRemainingTurns,autoLanguage});
      } else if (message.type === 'delivered') {
        if (!pendingRequestId || message.requestId !== pendingRequestId) return;
        awaiting = false; pendingRequestId = null;
        if (!demoMode) lastAudio = null;
        showTranscript(message);
        demoTextEvent('delivered', message);
      } else if (message.type === 'cancelled') {
        if (pendingRequestId && message.requestId === pendingRequestId) { awaiting = false; pendingRequestId = null; }
      } else if (message.type === 'translation') {
        const wasPaused = paused;
        ++epoch; capturePending = false; clearTimeout(restartTimer); discardRecording(); stopPlayback();
        showTranscript(message); lastAudio = message.audio;
        demoTextEvent('translation', message);
        const token = epoch;
        if (!wasPaused && lastAudio) void playAudio(lastAudio, token).catch(() => { if (token === epoch) { pause(); error('Автоматический звук не включился. Нажмите «Прослушать перевод».'); render(); } });
      } else if (message.type === 'error') {
        demoEvent('error', {code:typeof message.code === 'string' && /^[A-Z_]{1,80}$/.test(message.code) ? message.code : 'TRANSLATION_FAILED'});
        if (['ROOM_NOT_FOUND','INVALID_MEMBER_TOKEN','ROOM_EXPIRED'].includes(message.code)) {
          leave(resuming ? 'Сохранённая комната уже закрыта или время возврата истекло. Попросите новое приглашение.' : errorMessages[message.code]); return;
        }
        if (message.requestId && message.requestId !== pendingRequestId) return;
        awaiting = false; pendingRequestId = null;
        pause();
        error(errorMessages[message.code] || (typeof message.message === 'string' ? message.message : 'Не удалось обработать фразу.'));
        if (resuming && !room) { disconnected(); return; }
        if (!room) { const text = $('error').textContent; leave(text); return; }
      }
      render(); scheduleListening();
    };
    current.onerror = () => { if (socket === current) disconnected(); };
    current.onclose = (event) => {
      if (socket !== current) return;
      if (event?.code === 1000 && event.reason === 'Resumed elsewhere') {
        leave('Этот разговор открыт в другой вкладке. Продолжайте там или попросите новое приглашение.'); return;
      }
      disconnected();
    };
  }
  $('connect').addEventListener('click', () => connect());
  window.addEventListener('message', (event) => {
    if (!demoMode || !window.parent || window.parent === window || event.source !== window.parent || event.origin !== demoParentOrigin) return;
    const command = event.data;
    if (!command || typeof command !== 'object' || Array.isArray(command) || command.type !== 'translator-demo-command') return;
    if (command.action === 'connect') { connect(); return; }
    if (command.action === 'replay') { replayLastAudio(); return; }
    if (command.action !== 'fixture') return;
    if (!canSpeak()) { demoEvent('error', {code:'DEMO_NOT_READY'}); return; }
    const audio = command.audio;
    if (!audio || audio.encoding !== 'pcm16' || audio.sampleRate !== 16000 || audio.channels !== 1
      || typeof audio.data !== 'string' || audio.data.length > 426668
      || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(audio.data)) {
      demoEvent('error', {code:'DEMO_INVALID_AUDIO'}); return;
    }
    let bytes;
    try { bytes = base64ToBytes(audio.data); } catch { demoEvent('error', {code:'DEMO_INVALID_AUDIO'}); return; }
    if (bytes.length < 3200 || bytes.length > 320000 || bytes.length % 2 || bytesToBase64(bytes) !== audio.data) {
      demoEvent('error', {code:'DEMO_INVALID_AUDIO'}); return;
    }
    const requestId = `demo-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    try {
      error(); awaiting = true; pendingRequestId = requestId;
      send({type:'audio',requestId,audio:{encoding:'pcm16',sampleRate:16000,channels:1,data:audio.data}});
      demoEvent('fixture_sent', {bytes:bytes.length});
    } catch { awaiting = false; pendingRequestId = null; pause(); demoEvent('error', {code:'DEMO_SEND_FAILED'}); }
    render();
  });
  $('checkConnection').addEventListener('click', () => {
    const button=$('checkConnection');button.disabled=true;
    const result=$('connectionResult');
    result.textContent='Проверяю соединение с сервером…';
    let probe;
    let done=false;
    const finish=(message)=>{
      if(done)return;done=true;clearTimeout(timer);button.disabled=false;result.textContent=message;
      if(probe){probe.onopen=null;probe.onerror=null;probe.onclose=null;probe.close();}
    };
    const timer=setTimeout(()=>finish('Таймаут подключения. Откройте эту ссылку в Safari или Chrome и проверьте другую сеть.'),8000);
    try {
      probe=new WebSocket('wss://translate.45.88.201.146.sslip.io/v1/rooms');
      probe.onopen=()=>finish('Соединение с Gigahost работает. Запросов к голосовому сервису не было.');
      probe.onerror=()=>finish('Браузер не открыл соединение с Gigahost. Попробуйте Safari или Chrome и другую сеть.');
      probe.onclose=event=>finish(`Соединение закрыто (код ${event.code}). Сообщите этот код для проверки.`);
    }catch{finish('Браузер не поддерживает нужное соединение. Откройте ссылку в Safari или Chrome.');}
  });
  $('languageSearch').addEventListener('input', renderLanguageOptions);
  $('language').addEventListener('change', () => {
    if (!languageByCode.has($('language').value)) return;
    selectedLanguage = $('language').value;
    renderLanguageOptions();
  });
  $('leave').addEventListener('click', () => {
    if (socket?.readyState === WebSocket.OPEN) { try { send({type:'leave'}); } catch {} }
    leave();
  });
  $('record').addEventListener('click', () => socket?.readyState === WebSocket.OPEN ? activate() : connect());
  $('pause').addEventListener('click', pause);
  $('repeat').addEventListener('click', replayLastAudio);
  $('copy').addEventListener('click', async () => {
    const url = $('inviteLink').value;
    if (!url || !room) return;
    const button = $('copy'); button.disabled = true;
    $('inviteStatus').textContent = '';
    try {
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({title:'Приглашение в разговор',text:'Откройте ссылку, чтобы присоединиться к переводу.',url});
          $('inviteStatus').textContent = 'Приглашение передано выбранному приложению.';
          return;
        } catch (cause) {
          if (cause?.name === 'AbortError') { $('inviteStatus').textContent = 'Отправка отменена.'; return; }
        }
      }
      if (!room || $('inviteLink').value !== url) return;
      await navigator.clipboard.writeText(url);
      $('inviteStatus').textContent = 'Ссылка скопирована. Вставьте её в сообщение собеседнику.';
    } catch {
      $('inviteLink').focus(); $('inviteLink').select();
      error('Браузер не разрешил копирование. Ссылка выделена — скопируйте её вручную.');
    } finally { button.disabled = false; }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pause(); clearTimeout(reconnectTimer); }
    else if (reservation && !suspended && !socket && reconnectDeadline) retryConnection();
  });
  window.addEventListener('pagehide', () => {
    pause(); clearTimeout(reconnectTimer); suspended = true;
    if (reservation) {
      reconnectDeadline ||= Date.now() + resumeGraceMs;
      reservation.expiresAt = reconnectDeadline; saveReservation();
    }
    dropSocket(); ready = false; speechReady = false; busy = false; render();
  });
  window.addEventListener('pageshow', () => { suspended = false; render(); });
  for (const language of languages) {
    const option = document.createElement('option'); option.value = language.code; option.textContent = language.name;
    $('peerLanguage').appendChild(option);
  }
  $('peerLanguage').value = peerLanguage;
  $('voiceProfile').value = selectedVoiceProfile;
  $('voiceProfile').addEventListener('change', () => {
    if (voiceProfiles.has($('voiceProfile').value)) selectedVoiceProfile = $('voiceProfile').value;
  });
  function updatePreset() {
    if (peerLanguage === selectedLanguage) {
      peerLanguage = selectedLanguage === 'ru' ? 'nb' : 'ru';
      $('peerLanguage').value = peerLanguage;
    }
    $('presetSummary').textContent = `${names[selectedLanguage]} ↔ ${names[peerLanguage]}`;
  }
  $('peerLanguage').addEventListener('change', () => { peerLanguage = $('peerLanguage').value; updatePreset(); });
  $('language').addEventListener('change', updatePreset);
  updatePreset();
  renderLanguageOptions();
  render();
  if (incoming.roomId && incoming.inviteToken) {
    $('setupTitle').textContent = 'Присоединиться к разговору';
    $('connect').textContent = reservation ? 'Вернуться в разговор' : 'Начать разговор';
    $('setupHint').textContent = 'Ваш язык уже выбран в приглашении. Нажмите один раз и разрешите микрофон.';
  } else if (incoming.roomId || incoming.inviteToken) {
    error('Ссылка приглашения неполная. Попросите собеседника отправить её целиком.');
    $('connect').disabled = true;
  }
  if (reservation) {
    $('setupTitle').textContent = 'Вернуться в разговор';
    $('setupHint').textContent = 'Место временно сохранено. Нажмите один раз, чтобы вернуться в ту же комнату. Прошлая фраза не отправится повторно.';
  }
  if (demoMode) {
    $('setupHint').textContent = 'Тестовая запись · микрофон выключен. Управление проверкой — на общей странице двух участников.';
    $('repeat').textContent = 'Повторить полученный голос';
    demoEvent('loaded');
  }
})();

