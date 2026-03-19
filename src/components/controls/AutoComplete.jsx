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
  position: absolute;
  max-height: 300px;
  overflow-y: auto;
  background-color: white;
  z-index: 2000;
  border: 1px solid #ccc;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  border-radius: ${(props) => (props.isAbove ? '4px 4px 0 0' : '0 0 4px 4px')};
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
    ...rest
  } = props

  const value = field?.value || props.value
  const name = field?.name || props.name

  // --- Validação ---
  const error = getIn(form?.errors, name)
  const touched = getIn(form?.touched, name)
  const showError = Boolean(touched && error)

  const hideMessage =
    error === `${name} is a required field` ||
    (typeof error === 'string' && error.includes('is a required field'))

  const helperText = showError && !hideMessage ? error : ''

  const [query, setQuery] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [nothing, setNothing] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [boxPosition, setBoxPosition] = useState({ top: 0, left: 0, width: 0, isAbove: false })

  const debouncedQuery = useDebounce(query, 300)
  const valueText = value ? text(value) : query
  const isBoxOpen = data.length > 0 || nothing

  // --- Position ---
  const updateBoxPosition = useCallback(() => {
    const rect = ref.current?.getBoundingClientRect()
    if (rect) {
      const boxHeight = 300 // max-height
      const spaceBelow = window.innerHeight - rect.bottom
      const showAbove = spaceBelow < boxHeight && rect.top > boxHeight

      setBoxPosition({
        top: (showAbove ? rect.top - boxHeight : rect.bottom) + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        isAbove: showAbove,
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
      if (value) {
        // Ao digitar com item já selecionado, limpa a seleção e inicia nova pesquisa
        form?.setFieldValue?.(name, null)
        onChange?.(null)
        setQuery(newQuery)
        setLoading(true)
        return
      }
      setQuery(newQuery)
      setLoading(true)
    },
    [value, form, name, onChange]
  )

  const handleClear = useCallback(
    (e) => {
      e.preventDefault()
      isClearingRef.current = true

      form?.setFieldValue?.(name, null)
      onChange?.(null)

      setQuery('')
      setData([])
      setNothing(false)
      setLoading(false)
      setSelectedIndex(-1)

      inputRef.current?.focus()
    },
    [form, name, onChange]
  )

  const handleSearch = useCallback(
    async (e) => {
      e.preventDefault()

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        setLoading(true)
        setNothing(false)
        setSelectedIndex(0)

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
    [onSearch, query]
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
    if (!debouncedQuery || value) {
      setData([])
      setNothing(false)
      setLoading(false)
      return
    }

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setSelectedIndex(0)
    updateBoxPosition()

    onSearch(debouncedQuery, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result)
          setNothing(result.length === 0)
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err)
      })
      .finally(() => setLoading(false))
  }, [debouncedQuery, value, onSearch, updateBoxPosition])

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
        isAbove={boxPosition.isAbove}
        style={{
          top: boxPosition.isAbove ? boxPosition.top + (300 - (suggestionsRef.current?.offsetHeight || 0)) : boxPosition.top,
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
              : renderSuggestion(item)}
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
        onBlur={(e) => {
          field?.onBlur(e)

          if (!value && query) {
            isClearingRef.current = true
            setQuery('')
          }

          setData([])
        }}
        onKeyDown={handleKeyDown}
        fullWidth
        error={showError}
        helperText={helperText}
        InputLabelProps={{ shrink: true, ...props.InputLabelProps }}
        InputProps={{
          ...rest.InputProps,
          endAdornment: (
            <InputAdornment position="end">
              {loading ? (
                <IconButton size="small" edge="end" tabIndex={-1} disabled>
                  <CircularProgress size={18} color="inherit" />
                </IconButton>
              ) : valueText ? (
                <IconButton
                  size="small"
                  edge="end"
                  onMouseDown={handleClear}
                  disabled={props.disabled}
                  tabIndex={-1}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              ) : (
                <IconButton
                  size="small"
                  edge="end"
                  onMouseDown={handleSearch}
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