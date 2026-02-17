import React, { useState, useRef, useEffect } from 'react';

interface Option {
	id: number | string;
	name: string;
}

interface SearchableSelectProps {
	options: Option[];
	value: number | string;
	onChange: (value: number | string) => void;
	placeholder?: string;
	label?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
	error?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
	options,
	value,
	onChange,
	placeholder = 'Select an option',
	label,
	required = false,
	disabled = false,
	className = '',
	error
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLUListElement>(null);

	// Get the selected option
	const selectedOption = options.find(opt => opt.id === value);

	// Filter options based on search term
	const filteredOptions = options.filter(option =>
		option.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
				setSearchTerm('');
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Handle keyboard navigation
	useEffect(() => {
		if (isOpen && highlightedIndex >= 0 && listRef.current) {
			const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
			if (highlightedElement) {
				highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		}
	}, [highlightedIndex, isOpen]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				e.preventDefault();
				setIsOpen(true);
				setHighlightedIndex(0);
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setHighlightedIndex(prev =>
					prev < filteredOptions.length - 1 ? prev + 1 : prev
				);
				break;
			case 'ArrowUp':
				e.preventDefault();
				setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
				break;
			case 'Enter':
				e.preventDefault();
				if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
					handleSelect(filteredOptions[highlightedIndex]);
				}
				break;
			case 'Escape':
				setIsOpen(false);
				setSearchTerm('');
				setHighlightedIndex(-1);
				break;
		}
	};

	const handleSelect = (option: Option) => {
		onChange(option.id);
		setIsOpen(false);
		setSearchTerm('');
		setHighlightedIndex(-1);
	};

	const handleInputClick = () => {
		if (!disabled) {
			setIsOpen(!isOpen);
			if (!isOpen) {
				setHighlightedIndex(0);
			}
		}
	};

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
		setHighlightedIndex(0);
		if (!isOpen) {
			setIsOpen(true);
		}
	};

	return (
		<div className={className}>
			{label && (
				<label className="block text-sm font-medium text-gray-700 mb-1">
					{label} {required && <span className="text-red-500">*</span>}
				</label>
			)}
			<div ref={containerRef} className="relative">
				<div className="relative">
					<input
						ref={inputRef}
						type="text"
						value={isOpen ? searchTerm : selectedOption?.name || ''}
						onChange={handleSearchChange}
						onClick={handleInputClick}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						disabled={disabled}
						className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'
							} ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer bg-white'}`}
						autoComplete="off"
						readOnly={!isOpen}
					/>
					<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
						<svg
							className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''
								}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</div>
				</div>

				{isOpen && (
					<ul
						ref={listRef}
						className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
					>
						{filteredOptions.length > 0 ? (
							filteredOptions.map((option, index) => (
								<li
									key={option.id}
									onClick={() => handleSelect(option)}
									className={`px-3 py-2 cursor-pointer ${index === highlightedIndex
											? 'bg-blue-100'
											: 'hover:bg-gray-100'
										} ${option.id === value ? 'bg-blue-50 font-medium' : ''}`}
								>
									{option.name}
								</li>
							))
						) : (
							<li className="px-3 py-2 text-gray-500 text-center">
								No results found
							</li>
						)}
					</ul>
				)}
			</div>
			{error && <p className="text-red-500 text-sm mt-1">{error}</p>}
		</div>
	);
};

export default SearchableSelect;
