'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import styled from '@emotion/styled'
import { IconButton, InputAdornment, TextField as MuiTextField, CircularProgress } from '@mui/material'
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material'
import { getIn } from 'formik'

// --- Styled Components ---
const AutocompleteContainer = styled.div`
  position: relative;
  width: 100%;
`

const SuggestionsBox = styled.div`
  position: fixed;
  max-height: 300px;
  overflow-y: auto;
  background-color: white;
  z-index: 9999;
  border: 1px solid #ccc;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  border-radius: 0 0 4px 4px;
`

const Suggestion = styled.div`
  padding: 6px;
  cursor: pointer;
  &:hover,
  &.selected {
    color: white;
    background-color: dodgerblue;
  }
`

const Nothing = styled.div`
  padding: 6px;
  color: #888;
`

// --- Hook de Debounce ---
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// --- Componente Principal ---
export const AutoComplete = (props) => {
  const ref = useRef(null)
  const suggestionsRef = useRef(null)
  const inputRef = useRef(null)
  const selectedItemRef = useRef(null)
  const abortControllerRef = useRef(null)
  const isClearingRef = useRef(false)
  const {
    field,
    form,
    text,
    onSearch,
    onChange,
    children,
    renderSuggestion,
    // Destructure and ignore props that shouldn't leak to MuiTextField/DOM
    getOptionLabel,
    options,
    ...rest
  } = props

  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch

  const value = field?.value || props.value
  const name = field?.name || props.name

  // --- Validação ---
  const error = getIn(form?.errors, name)
  const touched = getIn(form?.touched, name)
  const showError = Boolean(touched && error)

  const hideMessage =
    error === `${name} is a required field` ||
    (typeof error === 'string' && (
      error.includes('is a required field') ||
      error.trim().toLowerCase() === 'obrigatório'
    ))

  const helperText = showError && !hideMessage ? error : ''

  const [query, setQuery] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [nothing, setNothing] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [boxPosition, setBoxPosition] = useState({ top: 0, left: 0, width: 0, isAbove: false })
  const [interacted, setInteracted] = useState(false)
  const [isFocused, setIsFocused] = useState(false)


  const debouncedQuery = useDebounce(query, 300)
  const valueText = value ? text(value) : query
  const isBoxOpen = data.length > 0 || nothing

  // --- Position ---
  const updateBoxPosition = useCallback(() => {
    const container = ref.current
    const inputBase = container?.querySelector('.MuiInputBase-root')
    const rect = (inputBase || container)?.getBoundingClientRect()

    if (rect) {
      const rawZoom = Number(
        window.getComputedStyle(document.body).getPropertyValue('--app-zoom')
      )
      const zoom = Number.isFinite(rawZoom) && rawZoom > 0 ? rawZoom : 1

      setBoxPosition({
        top: rect.bottom / zoom,
        left: rect.left / zoom,
        width: rect.width / zoom,
        isAbove: false,
      })
    }
  }, [])

  // --- Handlers ---
  const handleInputChange = useCallback(
    (e) => {
      if (isClearingRef.current) {
        isClearingRef.current = false
        // permite digitar após um clear/blur
      }
      const newQuery = e.target.value
      const shouldShowLoading = newQuery.trim().length > 0
      if (value) {
        // Ao digitar com item já selecionado, limpa a seleção e inicia nova pesquisa
        form?.setFieldValue?.(name, null)
        onChange?.(null, form)
        setQuery(newQuery)
        setInteracted(true)
        setLoading(shouldShowLoading)
        return
      }
      setQuery(newQuery)
      setInteracted(true)
      setLoading(shouldShowLoading)
    },
    [value, form, name, onChange]
  )

  const handleClear = useCallback(
    (e) => {
      // e.preventDefault()
      isClearingRef.current = true

      form?.setFieldValue?.(name, null)
      onChange?.(null, form)

      setQuery('')
      setData([])
      setNothing(false)
      setLoading(false)
      setSelectedIndex(-1)
      setInteracted(false)

      inputRef.current?.focus()

    },
    [form, name, onChange]
  )

  const handleSearch = useCallback(
    async (e) => {
      // e.preventDefault()

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        setLoading(true)
        setNothing(false)
        setSelectedIndex(0)
        setInteracted(true)
        updateBoxPosition()


        const resultData = await onSearch(query, controller.signal)
        setData(resultData)
        setNothing(resultData.length === 0)
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err)
      } finally {
        setLoading(false)
        inputRef.current?.focus()
      }
    },
    [onSearch, query, updateBoxPosition]
  )


  const handleSuggestionClick = useCallback(
    (item) => {
      form?.setFieldValue?.(name, item)
      onChange?.(item, form)

      setQuery('')
      setData([])
      setNothing(false)
      setLoading(false)
      setSelectedIndex(-1)

      inputRef.current?.focus()
    },
    [form, name, onChange]
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowDown' && data.length > 0) {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, data.length - 1))
      } else if (e.key === 'ArrowUp' && data.length > 0) {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && selectedIndex >= 0 && data[selectedIndex]) {
        e.preventDefault()
        handleSuggestionClick(data[selectedIndex])
      } else if (e.key === 'Escape' && isBoxOpen) {
        e.preventDefault()
        e.stopPropagation()
        setData([])
        setNothing(false)
        setLoading(false)
      }
    },
    [data, selectedIndex, isBoxOpen, handleSuggestionClick]
  )

  // ✅ CORREÇÃO DO CLICK OUTSIDE (Portal-safe)
  const handleClickOutside = useCallback((event) => {
    const clickedInsideInput =
      ref.current && ref.current.contains(event.target)

    const clickedInsideSuggestions =
      suggestionsRef.current &&
      suggestionsRef.current.contains(event.target)

    if (!clickedInsideInput && !clickedInsideSuggestions) {
      setData([])
      setNothing(false)
    }
  }, [])

  // --- Effects ---
  useEffect(() => {
    if (value) {
      setData([])
      setNothing(false)
      setLoading(false)
      return
    }

    const normalizedQuery = typeof debouncedQuery === 'string' ? debouncedQuery.trim() : ''
    const shouldAutoSearch = interacted && normalizedQuery.length > 0

    if (!shouldAutoSearch) {
      return
    }

    if (isClearingRef.current) {
      if (debouncedQuery === '') {
        isClearingRef.current = false
      }
      setLoading(false)
      return
    }

    if (!isFocused && data.length === 0) {
      return
    }

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    updateBoxPosition()
    setSelectedIndex(0)
    setLoading(true)

    onSearchRef.current(debouncedQuery, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result)
          setNothing(result.length === 0)
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })
  }, [debouncedQuery, value, updateBoxPosition, isFocused])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [selectedIndex])

  useEffect(() => {
    if (!isBoxOpen) return

    updateBoxPosition()
    window.addEventListener('scroll', updateBoxPosition, true)
    window.addEventListener('resize', updateBoxPosition)

    return () => {
      window.removeEventListener('scroll', updateBoxPosition, true)
      window.removeEventListener('resize', updateBoxPosition)
    }
  }, [isBoxOpen, updateBoxPosition])

  const suggestionsContent =
    isBoxOpen &&
    boxPosition &&
    ReactDOM.createPortal(
      <SuggestionsBox
        ref={suggestionsRef}
        style={{
          top: boxPosition.top,
          left: boxPosition.left,
          width: boxPosition.width,
        }}
      >
        {data.map((item, index) => (
          <Suggestion
            key={index}
            ref={index === selectedIndex ? selectedItemRef : null}
            className={index === selectedIndex ? 'selected' : ''}
            onMouseDown={(e) => {
              e.preventDefault()
              handleSuggestionClick(item)
            }}
          >
            {typeof children === 'function'
              ? children(item)
              : (renderSuggestion ? renderSuggestion(item) : text(item))}
          </Suggestion>
        ))}

        {nothing && (
          <Nothing
            onMouseDown={(e) => {
              e.preventDefault()
              setData([])
              setNothing(false)
            }}
          >
            Nenhum resultado encontrado!
          </Nothing>
        )}
      </SuggestionsBox>,
      document.body
    )

  return (
    <AutocompleteContainer ref={ref}>
      <MuiTextField
        {...rest}
        autoComplete="off"
        size={props.size ?? 'small'}
        variant={props.variant ?? 'filled'}
        inputRef={inputRef}
        name={name}
        value={valueText}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false)
          field?.onBlur(e)

          // Se o novo foco está dentro do componente (ex: clicou na lupa), não fecha
          if (ref.current && ref.current.contains(e.relatedTarget)) {
            return
          }

          // Aborta qualquer busca pendente ao sair do campo
          abortControllerRef.current?.abort()
          setData([])
          setLoading(false)
          setNothing(false)
          if (!value) {
            setQuery('')
            setInteracted(false)
          }
        }}
        onKeyDown={handleKeyDown}
        fullWidth
        error={showError}
        helperText={helperText}
        InputLabelProps={{ shrink: true, ...props.InputLabelProps }}
        InputProps={{
          ...rest.InputProps,
          endAdornment: (
            <InputAdornment position="end" sx={{ mt: '18px !important' }}>
              {loading ? (
                <IconButton size="small" edge="end" tabIndex={-1} disabled>
                  <CircularProgress size={18} color="inherit" />
                </IconButton>
              ) : valueText ? (
                <IconButton
                  size="small"
                  edge="end"
                  onClick={handleClear}
                  disabled={props.disabled}
                  tabIndex={-1}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              ) : (
                <IconButton
                  size="small"
                  edge="end"
                  onClick={handleSearch}
                  disabled={props.disabled}
                  tabIndex={-1}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
              )}

            </InputAdornment>
          ),
        }}
      />

      {suggestionsContent}
    </AutocompleteContainer>
  )
}

export default AutoComplete